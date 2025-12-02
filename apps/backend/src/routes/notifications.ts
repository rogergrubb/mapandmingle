import { Hono } from 'hono';
import { prisma } from '../index';

export const notificationsRoutes = new Hono();

// GET /api/notifications - Get unread notifications
notificationsRoutes.get('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      include: { fromUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// PUT /api/notifications/:id/read - Mark as read
notificationsRoutes.put('/:id/read', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return c.json(notification);
  } catch (error: any) {
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// DELETE /api/notifications/:id
notificationsRoutes.delete('/:id', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { id } = c.req.param();
    await prisma.notification.delete({ where: { id } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

export default notificationsRoutes;
