import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const connections = new Hono();

// All routes require authentication
connections.use('*', authMiddleware);

// Get all connections (friends) for current user
connections.get('/', async (c) => {
  const userId = c.get('userId');

  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'accepted' },
        { addresseeId: userId, status: 'accepted' },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
          lastActiveAt: true,
        },
      },
      addressee: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
          lastActiveAt: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Transform to return the "other" user in each connection
  const friends = connections.map((conn) => {
    const friend = conn.requesterId === userId ? conn.addressee : conn.requester;
    return {
      connectionId: conn.id,
      metAt: conn.metAt,
      metLocation: conn.metLocation,
      connectedAt: conn.updatedAt,
      user: friend,
    };
  });

  return c.json({ connections: friends });
});

// Get pending connection requests (received)
connections.get('/requests', async (c) => {
  const userId = c.get('userId');

  const requests = await prisma.connection.findMany({
    where: {
      addresseeId: userId,
      status: 'pending',
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return c.json({
    requests: requests.map((r) => ({
      connectionId: r.id,
      metAt: r.metAt,
      metLocation: r.metLocation,
      requestedAt: r.createdAt,
      user: r.requester,
    })),
  });
});

// Get sent connection requests (pending)
connections.get('/sent', async (c) => {
  const userId = c.get('userId');

  const sent = await prisma.connection.findMany({
    where: {
      requesterId: userId,
      status: 'pending',
    },
    include: {
      addressee: {
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
          bio: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return c.json({
    sent: sent.map((s) => ({
      connectionId: s.id,
      requestedAt: s.createdAt,
      user: s.addressee,
    })),
  });
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

  // Check if user is blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedId: addresseeId },
        { blockerId: addresseeId, blockedId: requesterId },
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
