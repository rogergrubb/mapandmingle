import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { broadcastToUser } from '../lib/websocket';
import { sendPushNotification } from './notifications';

export const videoCallRoutes = new Hono();

// POST /api/video-calls - Initiate a video call
videoCallRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { receiverId } = body;
    
    if (!receiverId) {
      return c.json({ error: 'Receiver ID required' }, 400);
    }
    
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { profile: true },
    });
    
    if (!receiver) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedUserId: receiverId },
          { blockerId: receiverId, blockedUserId: userId },
        ],
      },
    });
    
    if (block) {
      return c.json({ error: 'Cannot call this user' }, 403);
    }
    
    // Check premium status (optional - remove if video calls are free)
    const callerProfile = await prisma.profile.findUnique({ where: { userId } });
    
    // Create call record
    const call = await prisma.videoCall.create({
      data: {
        callerId: userId,
        receiverId,
        status: 'pending',
      },
    });
    
    // Get caller info for notification
    const caller = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    
    const callerName = caller?.profile?.displayName || caller?.name || 'Someone';
    
    // Send push notification
    await sendPushNotification(
      receiverId,
      `Incoming video call`,
      `${callerName} is calling you`,
      {
        type: 'video_call',
        callId: call.id,
        callerId: userId,
        callerName,
        callerAvatar: caller?.profile?.avatar,
      }
    );
    
    // Send WebSocket notification
    broadcastToUser(receiverId, {
      type: 'incoming_call',
      callId: call.id,
      caller: {
        id: userId,
        name: callerName,
        avatar: caller?.profile?.avatar,
      },
    });
    
    return c.json({ 
      callId: call.id,
      receiver: {
        id: receiver.id,
        name: receiver.profile?.displayName || receiver.name,
        avatar: receiver.profile?.avatar,
      },
    }, 201);
  } catch (error) {
    console.error('Error initiating call:', error);
    return c.json({ error: 'Failed to initiate call' }, 500);
  }
});

// GET /api/video-calls/:id - Get call details
videoCallRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const callId = c.req.param('id');
    
    const call = await prisma.videoCall.findUnique({
      where: { id: callId },
      include: {
        caller: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
    
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }
    
    // Must be participant
    if (call.callerId !== userId && call.receiverId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    
    return c.json({
      call: {
        id: call.id,
        status: call.status,
        startedAt: call.startedAt?.toISOString(),
        endedAt: call.endedAt?.toISOString(),
        duration: call.duration,
        caller: {
          id: call.caller.id,
          name: call.caller.profile?.displayName || call.caller.name,
          avatar: call.caller.profile?.avatar,
        },
        receiver: {
          id: call.receiver.id,
          name: call.receiver.profile?.displayName || call.receiver.name,
          avatar: call.receiver.profile?.avatar,
        },
        isCaller: call.callerId === userId,
      },
    });
  } catch (error) {
    console.error('Error getting call:', error);
    return c.json({ error: 'Failed to get call' }, 500);
  }
});

// PUT /api/video-calls/:id/answer - Answer call
videoCallRoutes.put('/:id/answer', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const callId = c.req.param('id');
    
    const call = await prisma.videoCall.findUnique({ where: { id: callId } });
    
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }
    
    if (call.receiverId !== userId) {
      return c.json({ error: 'Only receiver can answer' }, 403);
    }
    
    if (call.status !== 'pending') {
      return c.json({ error: 'Call is not pending' }, 400);
    }
    
    await prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });
    
    // Notify caller
    broadcastToUser(call.callerId, {
      type: 'call_answered',
      callId,
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error answering call:', error);
    return c.json({ error: 'Failed to answer call' }, 500);
  }
});

// PUT /api/video-calls/:id/decline - Decline call
videoCallRoutes.put('/:id/decline', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const callId = c.req.param('id');
    
    const call = await prisma.videoCall.findUnique({ where: { id: callId } });
    
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }
    
    if (call.receiverId !== userId) {
      return c.json({ error: 'Only receiver can decline' }, 403);
    }
    
    await prisma.videoCall.update({
      where: { id: callId },
      data: { status: 'declined' },
    });
    
    // Notify caller
    broadcastToUser(call.callerId, {
      type: 'call_declined',
      callId,
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error declining call:', error);
    return c.json({ error: 'Failed to decline call' }, 500);
  }
});

// PUT /api/video-calls/:id/end - End call
videoCallRoutes.put('/:id/end', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const callId = c.req.param('id');
    
    const call = await prisma.videoCall.findUnique({ where: { id: callId } });
    
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }
    
    // Must be participant
    if (call.callerId !== userId && call.receiverId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    
    const endedAt = new Date();
    const duration = call.startedAt
      ? Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000)
      : 0;
    
    await prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'ended',
        endedAt,
        duration,
      },
    });
    
    // Notify other party
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    broadcastToUser(otherUserId, {
      type: 'call_ended',
      callId,
      duration,
    });
    
    return c.json({ success: true, duration });
  } catch (error) {
    console.error('Error ending call:', error);
    return c.json({ error: 'Failed to end call' }, 500);
  }
});

// POST /api/video-calls/:id/signal - WebRTC signaling
videoCallRoutes.post('/:id/signal', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const callId = c.req.param('id');
    const body = await c.req.json();
    const { type, payload } = body; // type: offer, answer, ice-candidate
    
    const call = await prisma.videoCall.findUnique({ where: { id: callId } });
    
    if (!call) {
      return c.json({ error: 'Call not found' }, 404);
    }
    
    // Must be participant
    if (call.callerId !== userId && call.receiverId !== userId) {
      return c.json({ error: 'Not authorized' }, 403);
    }
    
    // Forward signal to other party
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    
    broadcastToUser(otherUserId, {
      type: `webrtc_${type}`,
      callId,
      fromUserId: userId,
      payload,
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error signaling:', error);
    return c.json({ error: 'Failed to signal' }, 500);
  }
});

// GET /api/video-calls/history - Get call history
videoCallRoutes.get('/history', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const limit = parseInt(c.req.query('limit') || '20');
    
    const calls = await prisma.videoCall.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        caller: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
    
    return c.json({
      calls: calls.map(call => {
        const otherUser = call.callerId === userId ? call.receiver : call.caller;
        return {
          id: call.id,
          status: call.status,
          duration: call.duration,
          isCaller: call.callerId === userId,
          isIncoming: call.receiverId === userId,
          createdAt: call.createdAt.toISOString(),
          otherUser: {
            id: otherUser.id,
            name: otherUser.profile?.displayName || otherUser.name,
            avatar: otherUser.profile?.avatar,
          },
        };
      }),
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    return c.json({ error: 'Failed to get history' }, 500);
  }
});
