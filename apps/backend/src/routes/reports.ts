import { Router } from 'hono';
import { prisma } from '../index';
import { z } from 'zod';

export const reportsRoutes = new Router();

const createReportSchema = z.object({
  reportedUserId: z.string(),
  category: z.enum(['harassment', 'threats', 'sexual_content', 'spam', 'fraud', 'other']),
  description: z.string().min(10).max(1000),
  screenshots: z.array(z.string()).max(5).optional(),
  pinId: z.string().optional(),
});

function generateConfirmationNumber(): string {
  return 'RPT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();
}

reportsRoutes.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid report data' }, 400);

    const { reportedUserId, category, description, screenshots, pinId } = parsed.data;
    if (userId === reportedUserId) return c.json({ error: 'Cannot report yourself' }, 400);

    const confirmationNumber = generateConfirmationNumber();
    const report = await prisma.report.create({
      data: { confirmationNumber, reporterId: userId, reportedUserId, category, description, screenshots: screenshots || [], pinId, status: 'pending' },
    });

    return c.json({ success: true, confirmationNumber: report.confirmationNumber, message: 'Report submitted successfully. Your report is anonymous.' });
  } catch (error) {
    console.error('Report error:', error);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

reportsRoutes.get('/status/:confirmationNumber', async (c) => {
  try {
    const { confirmationNumber } = c.req.param();
    const report = await prisma.report.findFirst({
      where: { confirmationNumber },
      select: { confirmationNumber: true, status: true, category: true, createdAt: true, actionTaken: true },
    });
    if (!report) return c.json({ error: 'Report not found' }, 404);
    return c.json(report);
  } catch (error) {
    return c.json({ error: 'Failed to fetch report status' }, 500);
  }
});

reportsRoutes.get('/admin/all', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const admin = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!admin || admin.email !== adminEmail) return c.json({ error: 'Admin access only' }, 403);

    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true, warningCount: true, isBanned: true, banExpiresAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return c.json(reports);
  } catch (error) {
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

reportsRoutes.post('/admin/:id/action', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const admin = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!admin || admin.email !== process.env.ADMIN_EMAIL) return c.json({ error: 'Admin access only' }, 403);

    const { id } = c.req.param();
    const body = await c.req.json() as any;
    const { action, reason, duration } = body;

    if (!['dismiss', 'warning', 'ban'].includes(action)) return c.json({ error: 'Invalid action' }, 400);

    const report = await prisma.report.findUnique({ where: { id }, include: { reportedUser: true } });
    if (!report) return c.json({ error: 'Report not found' }, 404);

    let actionData: any = { status: action };

    if (action === 'warning') {
      actionData.actionTaken = 'warning_48h';
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { warningCount: { increment: 1 }, isBanned: true, banExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), banReason: reason || 'Warning - 48 hour suspension' },
      });
    } else if (action === 'ban') {
      const banExpiresAt = duration === Infinity ? null : new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      actionData.actionTaken = duration === Infinity ? 'permanent_ban' : `ban_${duration}d`;
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isBanned: true, banExpiresAt, banReason: reason || `Ban - ${duration} days` },
      });
    }

    const updatedReport = await prisma.report.update({ where: { id }, data: actionData });
    return c.json({ success: true, message: `Action taken: ${action}`, report: updatedReport });
  } catch (error) {
    return c.json({ error: 'Failed to take action' }, 500);
  }
});

export default reportsRoutes;
