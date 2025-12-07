import { Hono } from 'hono';
import { prisma } from '../index';
import { sendTestNotification } from '../services/notificationService';

export const notificationsRoutes = new Hono();

// GET /api/notifications - Get all notifications (paginated)
notificationsRoutes.get('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const unreadOnly = c.req.query('unread') === 'true';

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { 
          fromUser: { 
            select: { 
              id: true, 
              name: true,
              profile: { select: { avatar: true, displayName: true } }
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return c.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// GET /api/notifications/unread-count - Quick unread count
notificationsRoutes.get('/unread-count', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return c.json({ count });
  } catch (error: any) {
    return c.json({ error: 'Failed to get count' }, 500);
  }
});

// GET /api/notifications/preferences - Get notification preferences
notificationsRoutes.get('/preferences', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        notifyFriendPins: true,
        notifyNearbyPins: true,
        nearbyRadiusKm: true,
        notifyViaEmail: true,
        notifyViaSms: true,
        notifyViaInApp: true,
        phoneNumber: true,
        phoneVerified: true,
        notificationDigest: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        quietHoursTimezone: true,
      },
    });

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json(profile);
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return c.json({ error: 'Failed to fetch preferences' }, 500);
  }
});

// PUT /api/notifications/preferences - Update notification preferences
notificationsRoutes.put('/preferences', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    
    // Only allow updating specific fields
    const allowedFields = [
      'notifyFriendPins',
      'notifyNearbyPins',
      'nearbyRadiusKm',
      'notifyViaEmail',
      'notifyViaSms',
      'notifyViaInApp',
      'phoneNumber',
      'notificationDigest',
      'quietHoursStart',
      'quietHoursEnd',
      'quietHoursTimezone',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If phone number changed, reset verification
    if (updateData.phoneNumber) {
      updateData.phoneVerified = false;
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: updateData,
      select: {
        notifyFriendPins: true,
        notifyNearbyPins: true,
        nearbyRadiusKm: true,
        notifyViaEmail: true,
        notifyViaSms: true,
        notifyViaInApp: true,
        phoneNumber: true,
        phoneVerified: true,
        notificationDigest: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        quietHoursTimezone: true,
      },
    });

    return c.json(profile);
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

// POST /api/notifications/test - Send test notification
notificationsRoutes.post('/test', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { type } = await c.req.json();
    if (!type || !['email', 'sms', 'inapp'].includes(type)) {
      return c.json({ error: 'Invalid type. Use: email, sms, or inapp' }, 400);
    }

    const result = await sendTestNotification(userId, type);
    return c.json(result);
  } catch (error: any) {
    console.error('Error sending test:', error);
    return c.json({ error: 'Failed to send test notification' }, 500);
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

// PUT /api/notifications/read-all - Mark all as read
notificationsRoutes.put('/read-all', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to mark all as read' }, 500);
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

// DELETE /api/notifications - Clear all notifications
notificationsRoutes.delete('/', async (c: any) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    await prisma.notification.deleteMany({ where: { userId } });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to clear notifications' }, 500);
  }
});

export default notificationsRoutes;
