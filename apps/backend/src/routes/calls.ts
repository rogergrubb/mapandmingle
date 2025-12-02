import { Hono } from 'hono';
import { prisma } from '../index';

export const callsRoutes = new Hono();

// POST /api/calls - Initiate call
callsRoutes.post('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body: any = await c.req.json();
    const { recipientId } = body;

    if (userId === recipientId) {
      return c.json({ error: 'Cannot call yourself' }, 400);
    }

    // Check if blocked
    const isBlocked = await prisma.blockedUser.findFirst({
      where: { blockerId: recipientId, blockedId: userId },
    });
    if (isBlocked) return c.json({ error: 'You are blocked by this user' }, 403);

    const call = await prisma.call.create({
      data: { initiatorId: userId, recipientId, status: 'pending' },
      include: {
        initiator: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'call',
        title: 'Incoming Call',
        body: `${call.initiator.name} is calling...`,
        fromUserId: userId,
        data: JSON.stringify({ callId: call.id }),
      },
    });

    return c.json(call);
  } catch (error: any) {
    console.error('Error initiating call:', error);
    return c.json({ error: 'Failed to initiate call' }, 500);
  }
});

// PUT /api/calls/:id/accept - Accept call
callsRoutes.put('/:id/accept', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();
    const call = await prisma.call.update({
      where: { id },
      data: { status: 'active' },
    });

    return c.json(call);
  } catch (error: any) {
    return c.json({ error: 'Failed to accept call' }, 500);
  }
});

// PUT /api/calls/:id/end - End call
callsRoutes.put('/:id/end', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();
    const body: any = await c.req.json();
    const { duration } = body; // in seconds

    const call = await prisma.call.update({
      where: { id },
      data: {
        status: 'completed',
        endTime: new Date(),
        duration: duration || 0,
      },
    });

    return c.json(call);
  } catch (error: any) {
    return c.json({ error: 'Failed to end call' }, 500);
  }
});

// GET /api/calls/history - Call history
callsRoutes.get('/history', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')) : 0;

    const calls = await prisma.call.findMany({
      where: {
        OR: [{ initiatorId: userId }, { recipientId: userId }],
      },
      include: {
        initiator: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return c.json(calls);
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch call history' }, 500);
  }
});

export default callsRoutes;
