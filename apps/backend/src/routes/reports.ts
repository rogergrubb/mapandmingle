import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// Report schema
const createReportSchema = z.object({
  targetType: z.enum(['user', 'pin', 'event', 'message', 'mingle', 'forum_post']),
  targetId: z.string(),
  reason: z.enum(['harassment', 'inappropriate', 'spam', 'impersonation', 'safety', 'other']),
  details: z.string().max(1000).optional(),
});

// Create a report
app.post(
  '/',
  zValidator('json', createReportSchema),
  async (c) => {
    const userId = c.get('userId');
    const { targetType, targetId, reason, details } = c.req.valid('json');
    const prisma = c.get('prisma');

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        targetType,
        targetId,
        reason,
        details,
        status: 'pending',
      },
    });

    // Auto-flag content if multiple reports
    const reportCount = await prisma.report.count({
      where: {
        targetType,
        targetId,
        status: { in: ['pending', 'reviewed'] },
      },
    });

    if (reportCount >= 3) {
      // Flag content for review
      switch (targetType) {
        case 'pin':
          await prisma.pin.update({
            where: { id: targetId },
            data: { isFlagged: true },
          });
          break;
        case 'user':
          await prisma.user.update({
            where: { id: targetId },
            data: { isFlagged: true },
          });
          break;
        case 'forum_post':
          await prisma.forumPost.update({
            where: { id: targetId },
            data: { isFlagged: true },
          });
          break;
      }
    }

    // Send notification to moderators (in production, use a queue)
    // await notifyModerators(report);

    return c.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id,
    });
  }
);

// Get user's reports (for transparency)
app.get('/my-reports', async (c) => {
  const userId = c.get('userId');
  const prisma = c.get('prisma');

  const reports = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      targetType: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  return c.json({ reports });
});

// Block a user
app.post('/block/:userId', async (c) => {
  const userId = c.get('userId');
  const targetUserId = c.req.param('userId');
  const prisma = c.get('prisma');

  if (userId === targetUserId) {
    return c.json({ error: 'Cannot block yourself' }, 400);
  }

  // Create block record
  await prisma.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: userId,
        blockedId: targetUserId,
      },
    },
    update: {},
    create: {
      blockerId: userId,
      blockedId: targetUserId,
    },
  });

  // Remove any existing connections/conversations
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
app.delete('/block/:userId', async (c) => {
  const userId = c.get('userId');
  const targetUserId = c.req.param('userId');
  const prisma = c.get('prisma');

  await prisma.block.deleteMany({
    where: {
      blockerId: userId,
      blockedId: targetUserId,
    },
  });

  return c.json({ success: true, message: 'User unblocked' });
});

// Get blocked users
app.get('/blocked', async (c) => {
  const userId = c.get('userId');
  const prisma = c.get('prisma');

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
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
      id: b.blocked.id,
      displayName: b.blocked.name,
      avatar: b.blocked.image,
      blockedAt: b.createdAt,
    }))
  );
});

export const reportRoutes = app;
export default app;
