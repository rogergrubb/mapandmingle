import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

export const reportRoutes = new Hono();

// Report schema
const createReportSchema = z.object({
  reportedUserId: z.string(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'fake', 'other']),
  description: z.string().max(500).optional(),
});

// Create a report for a user
reportRoutes.post(
  '/',
  zValidator('json', createReportSchema),
  async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { reportedUserId, reason, description } = c.req.valid('json');

    if (userId === reportedUserId) {
      return c.json({ error: 'Cannot report yourself' }, 400);
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId,
        reason,
        description,
        status: 'pending',
      },
    });

    return c.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id,
    });
  }
);

// Get user's reports (for transparency)
reportRoutes.get('/my-reports', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const reports = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return c.json({ reports });
});

// Block a user
reportRoutes.post('/block/:userId', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const targetUserId = c.req.param('userId');

  if (userId === targetUserId) {
    return c.json({ error: 'Cannot block yourself' }, 400);
  }

  // Create block record
  await prisma.block.upsert({
    where: {
      blockerId_blockedUserId: {
        blockerId: userId,
        blockedUserId: targetUserId,
      },
    },
    update: {},
    create: {
      blockerId: userId,
      blockedUserId: targetUserId,
    },
  });

  // Remove any existing conversations
  await prisma.conversation.deleteMany({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });

  return c.json({ success: true, message: 'User blocked' });
});

// Unblock a user
reportRoutes.delete('/block/:userId', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const targetUserId = c.req.param('userId');

  await prisma.block.deleteMany({
    where: {
      blockerId: userId,
      blockedUserId: targetUserId,
    },
  });

  return c.json({ success: true, message: 'User unblocked' });
});

// Get blocked users
reportRoutes.get('/blocked', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: {
      blockedUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return c.json(
    blocks.map((b) => ({
      id: b.blockedUser.id,
      displayName: b.blockedUser.name,
      avatar: b.blockedUser.image,
      blockedAt: b.createdAt,
    }))
  );
});
