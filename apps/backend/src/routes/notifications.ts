import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { broadcastToUser } from '../lib/websocket';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

export const notificationRoutes = new Hono();

// Initialize Expo SDK
const expo = new Expo();

// Register push token
notificationRoutes.post('/register', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { token, platform } = await c.req.json();

    if (!Expo.isExpoPushToken(token)) {
      return c.json({ error: 'Invalid push token' }, 400);
    }

    // Upsert push token
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
      },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Register push token error:', error);
    return c.json({ error: 'Failed to register token' }, 500);
  }
});

// Unregister push token
notificationRoutes.delete('/unregister', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { token } = await c.req.json();

    await prisma.pushToken.deleteMany({
      where: { token, userId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Unregister push token error:', error);
    return c.json({ error: 'Failed to unregister token' }, 500);
  }
});

// Get notification settings
notificationRoutes.get('/settings', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    // Return defaults if not set
    if (!settings) {
      return c.json({
        settings: {
          messages: true,
          waves: true,
          nearbyUsers: true,
          events: true,
          mingles: true,
          pinActivity: true,
          forumReplies: true,
          streakReminders: true,
          marketing: false,
        },
      });
    }

    return c.json({ settings });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return c.json({ error: 'Failed to get settings' }, 500);
  }
});

// Update notification settings
notificationRoutes.put('/settings', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();

    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates,
      },
    });

    return c.json({ settings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Get notifications
notificationRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return c.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

// Mark notification as read
notificationRoutes.put('/:id/read', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');

    await prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Mark all as read
notificationRoutes.put('/read-all', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// Helper: Send push notification to user
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    // Get user's push tokens
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) return;

    // Check notification settings
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    // Determine notification type from data
    const notificationType = data?.type as string;
    
    // Check if user has this notification type enabled
    if (settings) {
      const typeToSetting: Record<string, keyof typeof settings> = {
        message: 'messages',
        wave: 'waves',
        proximity: 'nearbyUsers',
        event_reminder: 'events',
        mingle_invite: 'mingles',
        pin_like: 'pinActivity',
        pin_comment: 'pinActivity',
        forum_reply: 'forumReplies',
        streak_milestone: 'streakReminders',
      };

      const settingKey = typeToSetting[notificationType];
      if (settingKey && settings[settingKey] === false) {
        return; // User has disabled this notification type
      }
    }

    // Build messages
    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data,
        badge: 1,
        channelId: getChannelId(notificationType),
      }));

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        
        // Handle invalid tokens
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'error') {
            if (ticket.details?.error === 'DeviceNotRegistered') {
              // Remove invalid token
              await prisma.pushToken.delete({
                where: { token: tokens[i].token },
              });
            }
          }
        }
      } catch (error) {
        console.error('Send push chunk error:', error);
      }
    }

    // Also send via WebSocket for real-time
    broadcastToUser(userId, {
      type: 'notification',
      title,
      body,
      data,
    });

    // Store in database
    await prisma.notification.create({
      data: {
        userId,
        type: notificationType || 'general',
        title,
        body,
        data: data || {},
        fromUserId: data?.fromUserId,
      },
    });

  } catch (error) {
    console.error('Send push notification error:', error);
  }
}

// Get Android channel ID based on notification type
function getChannelId(type?: string): string {
  switch (type) {
    case 'message':
      return 'messages';
    case 'wave':
    case 'proximity':
    case 'new_follower':
      return 'social';
    case 'event_reminder':
    case 'mingle_invite':
      return 'events';
    default:
      return 'default';
  }
}

// Helper: Send wave notification
export async function sendWaveNotification(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    include: { profile: true },
  });

  if (!fromUser) return;

  const displayName = fromUser.profile?.displayName || fromUser.name || 'Someone';

  await sendPushNotification(
    toUserId,
    `${displayName} waved at you! 👋`,
    'Wave back or start a conversation',
    {
      type: 'wave',
      fromUserId,
      userId: fromUserId,
    }
  );
}

// Helper: Send message notification
export async function sendMessageNotification(
  fromUserId: string,
  toUserId: string,
  chatId: string,
  messagePreview: string
): Promise<void> {
  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
    include: { profile: true },
  });

  if (!fromUser) return;

  const displayName = fromUser.profile?.displayName || fromUser.name || 'Someone';
  const preview = messagePreview.length > 50 
    ? messagePreview.slice(0, 50) + '...' 
    : messagePreview;

  await sendPushNotification(
    toUserId,
    displayName,
    preview,
    {
      type: 'message',
      fromUserId,
      chatId,
    }
  );
}

// Helper: Send proximity notification
export async function sendProximityNotification(
  userId: string,
  nearbyUser: { id: string; displayName: string; sharedInterests: string[] }
): Promise<void> {
  const interests = nearbyUser.sharedInterests.length > 0
    ? `You both like ${nearbyUser.sharedInterests.slice(0, 2).join(' and ')}`
    : 'Say hi!';

  await sendPushNotification(
    userId,
    `${nearbyUser.displayName} is nearby!`,
    interests,
    {
      type: 'proximity',
      userId: nearbyUser.id,
    }
  );
}

// Helper: Send event reminder
export async function sendEventReminder(
  userId: string,
  eventId: string,
  eventTitle: string,
  minutesUntil: number
): Promise<void> {
  const timeText = minutesUntil <= 60 
    ? `in ${minutesUntil} minutes` 
    : `in ${Math.round(minutesUntil / 60)} hours`;

  await sendPushNotification(
    userId,
    `Event starting ${timeText}`,
    eventTitle,
    {
      type: 'event_reminder',
      eventId,
    }
  );
}

// Helper: Send streak milestone notification
export async function sendStreakMilestone(
  userId: string,
  streakCount: number
): Promise<void> {
  await sendPushNotification(
    userId,
    `🔥 ${streakCount} Day Streak!`,
    'Keep it up! Your meetup streak is on fire!',
    {
      type: 'streak_milestone',
      streakCount,
    }
  );
}
