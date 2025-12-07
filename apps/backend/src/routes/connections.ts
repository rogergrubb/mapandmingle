import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { notifyAboutConnectionRequest, notifyAboutConnectionAccepted } from '../services/notificationService';

// Define context variables type for TypeScript
type Variables = {
  userId: string;
};

const connections = new Hono<{ Variables: Variables }>();

// All routes require authentication
connections.use('*', authMiddleware);

// Get all connections (friends) for current user
connections.get('/', async (c) => {
  const userId = c.get('userId');

  const connectionsList = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'accepted' },
        { addresseeId: userId, status: 'accepted' },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch user details for each connection
  const friends = await Promise.all(
    connectionsList.map(async (conn) => {
      const friendId = conn.requesterId === userId ? conn.addresseeId : conn.requesterId;
      const friend = await prisma.user.findUnique({
        where: { id: friendId },
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
          lastActiveAt: true,
        },
      });
      return {
        connectionId: conn.id,
        metAt: conn.metAt,
        metLocation: conn.metLocation,
        connectedAt: conn.updatedAt,
        user: friend,
      };
    })
  );

  return c.json({ connections: friends.filter(f => f.user) });
});

// Get pending connection requests (received)
connections.get('/requests', async (c) => {
  const userId = c.get('userId');

  const requestsList = await prisma.connection.findMany({
    where: {
      addresseeId: userId,
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
  });

  const requests = await Promise.all(
    requestsList.map(async (r) => {
      const requester = await prisma.user.findUnique({
        where: { id: r.requesterId },
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
        },
      });
      return {
        connectionId: r.id,
        metAt: r.metAt,
        metLocation: r.metLocation,
        requestedAt: r.createdAt,
        user: requester,
      };
    })
  );

  return c.json({ requests: requests.filter(r => r.user) });
});

// Get sent connection requests (pending)
connections.get('/sent', async (c) => {
  const userId = c.get('userId');

  const sentList = await prisma.connection.findMany({
    where: {
      requesterId: userId,
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
  });

  const sent = await Promise.all(
    sentList.map(async (s) => {
      const addressee = await prisma.user.findUnique({
        where: { id: s.addresseeId },
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
        },
      });
      return {
        connectionId: s.id,
        requestedAt: s.createdAt,
        user: addressee,
      };
    })
  );

  return c.json({ sent: sent.filter(s => s.user) });
});

// Check connection status with a specific user
connections.get('/status/:userId', async (c) => {
  const currentUserId = c.get('userId');
  const targetUserId = c.req.param('userId');

  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
    },
  });

  if (!connection) {
    return c.json({ status: 'none', connectionId: null });
  }

  // Determine if current user is the requester or addressee
  const isRequester = connection.requesterId === currentUserId;

  return c.json({
    status: connection.status,
    connectionId: connection.id,
    isRequester,
    canAccept: !isRequester && connection.status === 'pending',
  });
});

// Send a connection request
connections.post('/request', async (c) => {
  const requesterId = c.get('userId');
  const { addresseeId, metAt, metLocation } = await c.req.json();

  if (!addresseeId) {
    return c.json({ error: 'addresseeId is required' }, 400);
  }

  if (addresseeId === requesterId) {
    return c.json({ error: 'Cannot connect with yourself' }, 400);
  }

  // Check if connection already exists
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'accepted') {
      return c.json({ error: 'Already connected' }, 400);
    }
    if (existing.status === 'pending') {
      // If the other person already sent a request, auto-accept
      if (existing.requesterId === addresseeId) {
        const updated = await prisma.connection.update({
          where: { id: existing.id },
          data: { status: 'accepted' },
        });
        return c.json({ connection: updated, message: 'Connection accepted!' });
      }
      return c.json({ error: 'Request already pending' }, 400);
    }
    if (existing.status === 'blocked') {
      return c.json({ error: 'Cannot connect with this user' }, 400);
    }
  }

  // Check if user is blocked (using Block model with blockedUserId field)
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedUserId: addresseeId },
        { blockerId: addresseeId, blockedUserId: requesterId },
      ],
    },
  });

  if (blocked) {
    return c.json({ error: 'Cannot connect with this user' }, 400);
  }

  const connection = await prisma.connection.create({
    data: {
      requesterId,
      addresseeId,
      metAt,
      metLocation,
      status: 'pending',
    },
  });

  // Get requester name for notification
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { name: true, profile: { select: { displayName: true } } },
  });
  const requesterName = requester?.profile?.displayName || requester?.name || 'Someone';
  
  // Send notification to addressee
  notifyAboutConnectionRequest(addresseeId, requesterId, requesterName)
    .catch(err => console.error('Connection notification error:', err));

  return c.json({ connection, message: 'Connection request sent!' }, 201);
});

// Accept a connection request
connections.post('/:id/accept', async (c) => {
  const userId = c.get('userId');
  const connectionId = c.req.param('id');

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  if (connection.addresseeId !== userId) {
    return c.json({ error: 'Cannot accept this request' }, 403);
  }

  if (connection.status !== 'pending') {
    return c.json({ error: 'Request is not pending' }, 400);
  }

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: 'accepted' },
  });

  // Get accepter name for notification
  const accepter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, profile: { select: { displayName: true } } },
  });
  const accepterName = accepter?.profile?.displayName || accepter?.name || 'Someone';
  
  // Notify the original requester that their request was accepted
  notifyAboutConnectionAccepted(connection.requesterId, userId, accepterName)
    .catch(err => console.error('Accept notification error:', err));

  return c.json({ connection: updated, message: 'Connection accepted!' });
});

// Decline a connection request
connections.post('/:id/decline', async (c) => {
  const userId = c.get('userId');
  const connectionId = c.req.param('id');

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  if (connection.addresseeId !== userId) {
    return c.json({ error: 'Cannot decline this request' }, 403);
  }

  await prisma.connection.delete({
    where: { id: connectionId },
  });

  return c.json({ message: 'Request declined' });
});

// Remove a connection (unfriend)
connections.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const connectionId = c.req.param('id');

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  if (connection.requesterId !== userId && connection.addresseeId !== userId) {
    return c.json({ error: 'Cannot remove this connection' }, 403);
  }

  await prisma.connection.delete({
    where: { id: connectionId },
  });

  return c.json({ message: 'Connection removed' });
});

// Cancel a sent request
connections.delete('/request/:id', async (c) => {
  const userId = c.get('userId');
  const connectionId = c.req.param('id');

  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  if (connection.requesterId !== userId) {
    return c.json({ error: 'Cannot cancel this request' }, 403);
  }

  if (connection.status !== 'pending') {
    return c.json({ error: 'Request is not pending' }, 400);
  }

  await prisma.connection.delete({
    where: { id: connectionId },
  });

  return c.json({ message: 'Request cancelled' });
});

export default connections;
