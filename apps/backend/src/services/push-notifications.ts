import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const expo = new Expo();

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

export class PushNotificationService {
  /**
   * Send push notification to a single user
   */
  static async sendToUser(notification: PushNotificationData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
      console.log(`Invalid push token for user ${notification.userId}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: user.pushToken,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      badge: notification.badge,
      sound: notification.sound || 'default',
      priority: notification.priority || 'high',
    };

    try {
      const tickets = await expo.sendPushNotificationsAsync([message]);
      console.log('Push notification sent:', tickets);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToUsers(userIds: string[], notification: Omit<PushNotificationData, 'userId'>): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        pushToken: { not: null },
      },
      select: { pushToken: true },
    });

    const messages: ExpoPushMessage[] = users
      .filter(user => user.pushToken && Expo.isExpoPushToken(user.pushToken))
      .map(user => ({
        to: user.pushToken!,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
        sound: notification.sound || 'default',
        priority: notification.priority || 'high',
      }));

    if (messages.length === 0) {
      console.log('No valid push tokens found');
      return;
    }

    // Expo recommends sending in chunks of 100
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log(`Sent ${chunk.length} push notifications:`, tickets);
      } catch (error) {
        console.error('Failed to send push notification chunk:', error);
      }
    }
  }

  /**
   * Send subscription reminder
   */
  static async sendSubscriptionReminder(userId: string, daysUntilCharge: number): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'Free Trial Ending Soon',
      body: `Your free trial ends in ${daysUntilCharge} days. You'll be charged $0.99 or $4.99 depending on your plan.`,
      data: { type: 'subscription_reminder', daysUntilCharge },
    });
  }

  /**
   * Send payment success notification
   */
  static async sendPaymentSuccess(userId: string, amount: number): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'Payment Successful',
      body: `Your subscription payment of $${amount.toFixed(2)} was processed successfully.`,
      data: { type: 'payment_success', amount },
    });
  }

  /**
   * Send payment failed notification
   */
  static async sendPaymentFailed(userId: string): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'Payment Failed',
      body: 'We couldn\'t process your subscription payment. Please update your payment method.',
      data: { type: 'payment_failed' },
      priority: 'high',
    });
  }

  /**
   * Send wave notification
   */
  static async sendWaveNotification(recipientId: string, senderName: string): Promise<void> {
    await this.sendToUser({
      userId: recipientId,
      title: 'New Wave!',
      body: `${senderName} sent you a wave 👋`,
      data: { type: 'wave', senderName },
    });
  }

  /**
   * Send event invitation
   */
  static async sendEventInvitation(userId: string, eventTitle: string, eventId: string): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'Event Invitation',
      body: `You've been invited to: ${eventTitle}`,
      data: { type: 'event_invitation', eventId, eventTitle },
    });
  }

  /**
   * Send event reminder
   */
  static async sendEventReminder(userId: string, eventTitle: string, eventId: string, startsIn: string): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'Event Starting Soon',
      body: `${eventTitle} starts ${startsIn}`,
      data: { type: 'event_reminder', eventId, eventTitle },
    });
  }

  /**
   * Send message notification
   */
  static async sendMessageNotification(recipientId: string, senderName: string, messagePreview: string): Promise<void> {
    await this.sendToUser({
      userId: recipientId,
      title: `Message from ${senderName}`,
      body: messagePreview,
      data: { type: 'message', senderName },
    });
  }

  /**
   * Send welcome notification for new users
   */
  static async sendWelcomeNotification(userId: string, displayName: string): Promise<void> {
    await this.sendToUser({
      userId,
      title: `Welcome to MapMingle, ${displayName}!`,
      body: 'Start exploring events and connecting with people nearby.',
      data: { type: 'welcome' },
    });
  }

  /**
   * Send re-engagement notification for inactive users
   */
  static async sendReEngagementNotification(userId: string): Promise<void> {
    await this.sendToUser({
      userId,
      title: 'We Miss You!',
      body: 'Check out what\'s happening near you. New events and people are waiting!',
      data: { type: 're_engagement' },
    });
  }

  /**
   * Broadcast to all active subscribers
   */
  static async broadcastToSubscribers(notification: Omit<PushNotificationData, 'userId'>): Promise<void> {
    const subscribers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active',
        pushToken: { not: null },
      },
      select: { id: true },
    });

    await this.sendToUsers(
      subscribers.map(s => s.id),
      notification
    );
  }
}
