import { Hono } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';

export const reportRoutes = new Hono();

const createReportSchema = z.object({
  reportedUserId: z.string(),
  category: z.enum(['harassment', 'threats', 'sexual_content', 'spam', 'fraud', 'other']).optional(),
  description: z.string().min(10).max(1000),
  pinId: z.string().optional(),
});

// POST /api/reports - Submit a report
reportRoutes.post('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid report data' }, 400);
    }

    const { reportedUserId, description } = parsed.data;

    if (userId === reportedUserId) {
      return c.json({ error: 'Cannot report yourself' }, 400);
    }

    // Create report using available fields
    const report = await prisma.report.create({
      data: {
        type: 'user_report',
        reason: description,
        status: 'pending',
        description: description,
        reportedUserId: reportedUserId,
      },
    });

    // Generate confirmation number from report ID
    const confirmationNumber = 'RPT' + report.id.substring(0, 10).toUpperCase();

    return c.json({
      success: true,
      confirmationNumber,
      reportId: report.id,
      message: 'Report submitted successfully. Your report is anonymous.',
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

// GET /api/reports/status/:id - Check report status
reportRoutes.get('/status/:id', async (c: any) => {
  try {
    const { id } = c.req.param();

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    return c.json({
      id: report.id,
      status: report.status,
      createdAt: report.createdAt,
      reason: report.reason,
      type: report.type,
    });
  } catch (error) {
    console.error('Error fetching report status:', error);
    return c.json({ error: 'Failed to fetch report status' }, 500);
  }
});

// GET /api/admin/reports - Get all reports (admin only)
reportRoutes.get('/admin/all', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!admin || admin.email !== adminEmail) {
      return c.json({ error: 'Admin access only' }, 403);
    }

    const reports = await prisma.report.findMany({
      where: { type: 'user_report' },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// POST /api/admin/reports/:id/action - Take action on report
reportRoutes.post('/admin/:id/action', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!admin || admin.email !== adminEmail) {
      return c.json({ error: 'Admin access only' }, 403);
    }

    const { id } = c.req.param();
    const body = await c.req.json() as any;
    const { action, reason } = body;

    if (!['dismiss', 'warning', 'ban'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: action === 'dismiss' ? 'dismissed' : action === 'warning' ? 'warning_48h' : 'banned',
      },
    });

    return c.json({
      success: true,
      message: `Action taken: ${action}`,
      report: updatedReport,
    });
  } catch (error) {
    console.error('Error taking report action:', error);
    return c.json({ error: 'Failed to take action' }, 500);
  }
});
