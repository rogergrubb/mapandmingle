import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { generateRtcToken, getAppId } from '../lib/agora';
import { nanoid } from 'nanoid';

// Define context variables type for TypeScript
type Variables = {
  userId: string;
};

const calls = new Hono<{ Variables: Variables }>();

// All routes require authentication
calls.use('*', authMiddleware);

// Store active calls in memory (for MVP - use Redis in production)
const activeCalls = new Map<string, {
  callId: string;
  channelName: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  callerImage: string | null;
  status: 'ringing' | 'active' | 'ended';
  isVideo: boolean;
  startedAt: Date;
}>();

// Get pending incoming calls for current user
calls.get('/incoming', async (c) => {
  const userId = c.get('userId');
  
  const incomingCalls = Array.from(activeCalls.values())
    .filter(call => call.calleeId === userId && call.status === 'ringing');
  
  return c.json({ calls: incomingCalls });
});

// Generate token for joining a call
calls.post('/token', async (c) => {
  const userId = c.get('userId');
  const { channelName } = await c.req.json();
  
  if (!channelName) {
    return c.json({ error: 'channelName is required' }, 400);
  }
  
  // Generate a numeric UID from the user ID for Agora
  const uid = Math.abs(hashCode(userId)) % 1000000000;
  
  const { token, appId } = generateRtcToken(channelName, uid);
  
  return c.json({ 
    token, 
    appId,
    uid,
    channelName,
  });
});

// Initiate a call to another user
calls.post('/initiate', async (c) => {
  const callerId = c.get('userId');
  const { calleeId, isVideo = true } = await c.req.json();
  
  if (!calleeId) {
    return c.json({ error: 'calleeId is required' }, 400);
  }
  
  if (calleeId === callerId) {
    return c.json({ error: 'Cannot call yourself' }, 400);
  }
  
  // Check if callee exists and get their online status
  const callee = await prisma.user.findUnique({
    where: { id: calleeId },
    select: { 
      id: true, 
      name: true,
      lastActiveAt: true,
      profile: {
        select: {
          ghostMode: true,
        }
      }
    },
  });
  
  if (!callee) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Check if user is in ghost mode (not accepting interactions)
  if (callee.profile?.ghostMode) {
    return c.json({ error: 'User is not available for calls' }, 403);
  }
  
  // Check if user is online (active in last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isOnline = callee.lastActiveAt && new Date(callee.lastActiveAt) > fiveMinutesAgo;
  
  if (!isOnline) {
    return c.json({ 
      error: 'User is currently offline',
      offline: true,
      lastActive: callee.lastActiveAt,
    }, 400);
  }
  
  if (!callee) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Get caller info
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { id: true, name: true, displayName: true, image: true },
  });
  
  // Check if user is blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: callerId, blockedUserId: calleeId },
        { blockerId: calleeId, blockedUserId: callerId },
      ],
    },
  });
  
  if (blocked) {
    return c.json({ error: 'Cannot call this user' }, 403);
  }
  
  // Generate unique channel name
  const callId = nanoid(12);
  const channelName = `mm_call_${callId}`;
  
  // Create call record
  const callRecord = {
    callId,
    channelName,
    callerId,
    calleeId,
    callerName: caller?.displayName || caller?.name || 'Unknown',
    callerImage: caller?.image || null,
    status: 'ringing' as const,
    isVideo,
    startedAt: new Date(),
  };
  
  activeCalls.set(callId, callRecord);
  
  // Auto-expire call after 60 seconds if not answered
  setTimeout(() => {
    const call = activeCalls.get(callId);
    if (call && call.status === 'ringing') {
      activeCalls.delete(callId);
    }
  }, 60000);
  
  // Generate token for caller
  const callerUid = Math.abs(hashCode(callerId)) % 1000000000;
  const { token, appId } = generateRtcToken(channelName, callerUid);
  
  return c.json({
    callId,
    channelName,
    token,
    appId,
    uid: callerUid,
    callee: {
      id: callee.id,
      name: callee.name,
    },
  }, 201);
});

// Accept an incoming call
calls.post('/:callId/accept', async (c) => {
  const userId = c.get('userId');
  const callId = c.req.param('callId');
  
  const call = activeCalls.get(callId);
  
  if (!call) {
    return c.json({ error: 'Call not found or expired' }, 404);
  }
  
  if (call.calleeId !== userId) {
    return c.json({ error: 'Not authorized to accept this call' }, 403);
  }
  
  if (call.status !== 'ringing') {
    return c.json({ error: 'Call is not ringing' }, 400);
  }
  
  // Update call status
  call.status = 'active';
  activeCalls.set(callId, call);
  
  // Generate token for callee
  const calleeUid = Math.abs(hashCode(userId)) % 1000000000;
  const { token, appId } = generateRtcToken(call.channelName, calleeUid);
  
  return c.json({
    callId,
    channelName: call.channelName,
    token,
    appId,
    uid: calleeUid,
    isVideo: call.isVideo,
  });
});

// Reject/decline an incoming call
calls.post('/:callId/reject', async (c) => {
  const userId = c.get('userId');
  const callId = c.req.param('callId');
  
  const call = activeCalls.get(callId);
  
  if (!call) {
    return c.json({ error: 'Call not found' }, 404);
  }
  
  if (call.calleeId !== userId) {
    return c.json({ error: 'Not authorized to reject this call' }, 403);
  }
  
  // Remove call
  activeCalls.delete(callId);
  
  return c.json({ message: 'Call rejected' });
});

// End an active call
calls.post('/:callId/end', async (c) => {
  const userId = c.get('userId');
  const callId = c.req.param('callId');
  
  const call = activeCalls.get(callId);
  
  if (!call) {
    return c.json({ error: 'Call not found' }, 404);
  }
  
  if (call.callerId !== userId && call.calleeId !== userId) {
    return c.json({ error: 'Not authorized to end this call' }, 403);
  }
  
  // Remove call
  activeCalls.delete(callId);
  
  return c.json({ message: 'Call ended' });
});

// Get call status
calls.get('/:callId/status', async (c) => {
  const callId = c.req.param('callId');
  
  const call = activeCalls.get(callId);
  
  if (!call) {
    return c.json({ status: 'ended', callId });
  }
  
  return c.json({
    callId: call.callId,
    status: call.status,
    isVideo: call.isVideo,
    channelName: call.channelName,
  });
});

// Get Agora App ID (for client initialization)
calls.get('/config', async (c) => {
  return c.json({ appId: getAppId() });
});

// Helper function to generate numeric hash from string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

export default calls;
