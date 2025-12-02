import { Hono } from 'hono';
import { prisma } from '../index';

export const blockingRoutes = new Hono();

// POST /api/blocking/block/:userId - Block a user
blockingRoutes.post('/block/:userId', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const { userId } = c.req.param();
    
    if (currentUserId === userId) {
      return c.json({ error: 'Cannot block yourself' }, 400);
    }

    const body: any = await c.req.json();
    const { reason } = body;

    // Check if already blocked
    const existing = await prisma.blockedUser.findFirst({
      where: { blockerId: currentUserId, blockedId: userId },
    });

    if (existing) {
      return c.json({ error: 'User already blocked' }, 400);
    }

    const blocked = await prisma.blockedUser.create({
      data: {
        blockerId: currentUserId,
        blockedId: userId,
        reason,
      },
    });

    return c.json({ success: true, blocked });
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

// POST /api/blocking/unblock/:userId - Unblock a user
blockingRoutes.post('/unblock/:userId', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const { userId } = c.req.param();

    await prisma.blockedUser.deleteMany({
      where: { blockerId: currentUserId, blockedId: userId },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

// GET /api/blocking/blocked - Get list of blocked users
blockingRoutes.get('/blocked', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: currentUserId },
      include: {
        blocked: { select: { id: true, name: true, email: true } },
      },
    });

    return c.json(blocked);
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch blocked users' }, 500);
  }
});

// GET /api/blocking/check/:userId - Check if user is blocked
blockingRoutes.get('/check/:userId', async (c: any) => {
  try {
    const currentUserId = c.req.header('X-User-Id');
    if (!currentUserId) return c.json({ error: 'Unauthorized' }, 401);

    const { userId } = c.req.param();

    const isBlocked = await prisma.blockedUser.findFirst({
      where: { blockerId: currentUserId, blockedId: userId },
    });

    return c.json({ isBlocked: !!isBlocked });
  } catch (error: any) {
    return c.json({ error: 'Failed to check block status' }, 500);
  }
});

export default blockingRoutes;
