import { Hono } from 'hono';
import { prisma } from '../index';

export const reportRoutes = new Hono();

// POST /api/reports - Submit a report
reportRoutes.post('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body: any = await c.req.json();
    const { reportedUserId, description } = body;

    if (!reportedUserId || !description) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (userId === reportedUserId) {
      return c.json({ error: 'Cannot report yourself' }, 400);
    }

    const report = await prisma.report.create({
      data: {
        type: 'user_report',
        reason: description,
        status: 'pending',
        description: description,
        reportedUserId: reportedUserId,
      },
    });

    const confirmationNumber = 'RPT' + report.id.substring(0, 10).toUpperCase();

    return c.json({
      success: true,
      confirmationNumber,
      reportId: report.id,
    });
  } catch (error: any) {
    console.error('Report error:', error);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

// GET /api/reports/status/:id
reportRoutes.get('/status/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) return c.json({ error: 'Report not found' }, 404);

    return c.json({
      id: report.id,
      status: report.status,
      createdAt: report.createdAt,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch report' }, 500);
  }
});

// GET /api/admin/reports
reportRoutes.get('/admin/all', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!admin || admin.email !== process.env.ADMIN_EMAIL) {
      return c.json({ error: 'Admin access only' }, 403);
    }

    const reports = await prisma.report.findMany({
      where: { type: 'user_report' },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(reports);
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// POST /api/admin/reports/:id/action
reportRoutes.post('/admin/:id/action', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!admin || admin.email !== process.env.ADMIN_EMAIL) {
      return c.json({ error: 'Admin access only' }, 403);
    }

    const { id } = c.req.param();
    const body: any = await c.req.json();
    const { action } = body;

    if (!['dismiss', 'warning', 'ban'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    const statusMap: Record<string, string> = {
      dismiss: 'dismissed',
      warning: 'warning_48h',
      ban: 'banned',
    };

    const updatedReport = await prisma.report.update({
      where: { id },
      data: { status: statusMap[action] },
    });

    return c.json({ success: true, report: updatedReport });
  } catch (error: any) {
    return c.json({ error: 'Failed to take action' }, 500);
  }
});
