import { Hono } from 'hono';
import { prisma } from '../index';

export const safetyRoutes = new Hono();

// POST /api/safety/block/:userId - Block a user
safetyRoutes.post('/block/:userId', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const blockedUserId = c.req.param('userId');
    const body = await c.req.json().catch(() => ({}));
    
    await prisma.block.upsert({
      where: { blockerId_blockedUserId: { blockerId: userId, blockedUserId } },
      create: { blockerId: userId, blockedUserId, reason: body.reason },
      update: { reason: body.reason },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

// DELETE /api/safety/block/:userId - Unblock a user
safetyRoutes.delete('/block/:userId', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const blockedUserId = c.req.param('userId');
    
    await prisma.block.deleteMany({
      where: { blockerId: userId, blockedUserId },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

// GET /api/safety/blocked - Get blocked users
safetyRoutes.get('/blocked', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blockedUser: {
          select: { id: true, name: true, image: true },
        },
      },
    });
    
    return c.json(blocks.map(b => ({
      id: b.id,
      blockedUserId: b.blockedUserId,
      blockedUser: b.blockedUser,
      blockedAt: b.createdAt.toISOString(),
    })));
  } catch (error) {
    return c.json({ error: 'Failed to fetch blocked users' }, 500);
  }
});

// POST /api/safety/report/:userId - Report a user
safetyRoutes.post('/report/:userId', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const reportedUserId = c.req.param('userId');
    const body = await c.req.json();
    
    await prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId,
        reason: body.reason,
        description: body.description,
      },
    });
    
    // Increment spam reports on reported user's profile
    await prisma.profile.update({
      where: { userId: reportedUserId },
      data: { spamReports: { increment: 1 } },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to report user' }, 500);
  }
});
