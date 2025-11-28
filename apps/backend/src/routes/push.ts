import { Hono } from 'hono';
import { PushNotificationService } from '../services/push-notifications';
import { requireUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const push = new Hono();

/**
 * Register push token for user
 */
push.post('/register', async (c) => {
  const userId = requireUserId(c);
  const { pushToken } = await c.req.json();

  if (!pushToken) {
    return c.json({ error: 'Push token is required' }, 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { pushToken },
  });

  return c.json({ success: true, message: 'Push token registered' });
});

/**
 * Unregister push token
 */
push.post('/unregister', async (c) => {
  const userId = requireUserId(c);

  await prisma.user.update({
    where: { id: userId },
    data: { pushToken: null },
  });

  return c.json({ success: true, message: 'Push token unregistered' });
});

/**
 * Send test notification (for testing)
 */
push.post('/test', async (c) => {
  const userId = requireUserId(c);

  await PushNotificationService.sendToUser({
    userId,
    title: 'Test Notification',
    body: 'This is a test push notification from MapMingle!',
    data: { type: 'test' },
  });

  return c.json({ success: true, message: 'Test notification sent' });
});

/**
 * Admin: Broadcast notification to all subscribers
 */
push.post('/broadcast', async (c) => {
  // TODO: Add admin check middleware
  const userId = requireUserId(c);
  const { title, body, data } = await c.req.json();

  if (!title || !body) {
    return c.json({ error: 'Title and body are required' }, 400);
  }

  await PushNotificationService.broadcastToSubscribers({
    title,
    body,
    data,
  });

  return c.json({ success: true, message: 'Broadcast sent' });
});

export { push };
