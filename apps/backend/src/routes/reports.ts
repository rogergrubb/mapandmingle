import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../index';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Report schema - simplified to match actual Prisma schema
const createReportSchema = z.object({
  reportedUserId: z.string(),
  reason: z.string(),
  description: z.string().max(500).optional(),
});

// Create a report (user reports only, matching schema)
app.post(
  '/',
  zValidator('json', createReportSchema),
  async (c) => {
    const userId = c.get('userId') as string;
    const { reportedUserId, reason, description } = c.req.valid('json');

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
app.get('/my-reports', async (c) => {
  const userId = c.get('userId') as string;

  const reports = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      reportedUser: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return c.json({ reports });
});

// Block a user
app.post('/block/:userId', async (c) => {
  const userId = c.get('userId') as string;
  const targetUserId = c.req.param('userId');

  if (userId === targetUserId) {
    return c.json({ error: 'Cannot block yourself' }, 400);
  }

  // Check if already blocked
  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedUserId: {
        blockerId: userId,
        blockedUserId: targetUserId,
      },
    },
  });

  if (existing) {
    return c.json({ error: 'User already blocked' }, 400);
  }

  // Create block
  await prisma.block.create({
    data: {
      blockerId: userId,
      blockedUserId: targetUserId,
    },
  });

  return c.json({ success: true, message: 'User blocked' });
});

// Unblock a user
app.delete('/block/:userId', async (c) => {
  const userId = c.get('userId') as string;
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
app.get('/blocked', async (c) => {
  const userId = c.get('userId') as string;

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
    blocks.map((b: any) => ({
      id: b.blockedUser.id,
      displayName: b.blockedUser.name,
      avatar: b.blockedUser.image,
      blockedAt: b.createdAt,
    }))
  );
});

export const reportRoutes = app;
export default app;
