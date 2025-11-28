import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  eventData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Track a user event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO analytics_events (user_id, event_type, event_data, metadata, created_at)
        VALUES (${event.userId}, ${event.eventType}, ${JSON.stringify(event.eventData || {})}, ${JSON.stringify(event.metadata || {})}, NOW())
      `;
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - analytics should never break the main flow
    }
  }

  /**
   * Track subscription conversion
   */
  static async trackSubscriptionConversion(userId: string, tier: string, source?: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'subscription_converted',
      eventData: { tier, source },
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Track subscription cancellation
   */
  static async trackSubscriptionCancellation(userId: string, tier: string, reason?: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'subscription_cancelled',
      eventData: { tier, reason },
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Track user engagement
   */
  static async trackEngagement(userId: string, action: string, details?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'user_engagement',
      eventData: { action, ...details },
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Get subscription conversion rate
   */
  static async getConversionRate(startDate: Date, endDate: Date): Promise<number> {
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const subscribedUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        subscriptionStatus: 'active',
      },
    });

    return totalUsers > 0 ? (subscribedUsers / totalUsers) * 100 : 0;
  }

  /**
   * Get Monthly Recurring Revenue (MRR)
   */
  static async getMRR(): Promise<number> {
    const basicCount = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionTier: 'basic',
      },
    });

    const premiumCount = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionTier: 'premium',
      },
    });

    return (basicCount * 0.99) + (premiumCount * 4.99);
  }

  /**
   * Get churn rate
   */
  static async getChurnRate(startDate: Date, endDate: Date): Promise<number> {
    const startingSubscribers = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionEnd: {
          gte: startDate,
        },
      },
    });

    const churned = await prisma.user.count({
      where: {
        subscriptionStatus: 'canceled',
        subscriptionEnd: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return startingSubscribers > 0 ? (churned / startingSubscribers) * 100 : 0;
  }

  /**
   * Get user retention by cohort
   */
  static async getRetentionRate(cohortDate: Date, daysAfter: number): Promise<number> {
    const cohortEndDate = new Date(cohortDate);
    cohortEndDate.setDate(cohortEndDate.getDate() + 1);

    const cohortUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEndDate,
        },
      },
    });

    const checkDate = new Date(cohortDate);
    checkDate.setDate(checkDate.getDate() + daysAfter);

    const activeUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEndDate,
        },
        lastActiveAt: {
          gte: checkDate,
        },
      },
    });

    return cohortUsers > 0 ? (activeUsers / cohortUsers) * 100 : 0;
  }

  /**
   * Get top performing events
   */
  static async getTopEvents(limit: number = 10): Promise<Array<{ eventId: string; attendees: number }>> {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            attendees: true,
          },
        },
      },
      orderBy: {
        attendees: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return events.map(event => ({
      eventId: event.id,
      attendees: event._count.attendees,
    }));
  }

  /**
   * Get user lifetime value (LTV)
   */
  static async getUserLTV(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        createdAt: true,
        subscriptionEnd: true,
      },
    });

    if (!user || !user.subscriptionTier) {
      return 0;
    }

    const monthlyRevenue = user.subscriptionTier === 'basic' ? 0.99 : 4.99;
    const startDate = user.createdAt;
    const endDate = user.subscriptionEnd || new Date();
    const monthsSubscribed = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    return monthlyRevenue * monthsSubscribed;
  }

  /**
   * Get revenue by tier
   */
  static async getRevenueByTier(): Promise<{ basic: number; premium: number; total: number }> {
    const basicRevenue = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionTier: 'basic',
      },
    }) * 0.99;

    const premiumRevenue = await prisma.user.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionTier: 'premium',
      },
    }) * 4.99;

    return {
      basic: basicRevenue,
      premium: premiumRevenue,
      total: basicRevenue + premiumRevenue,
    };
  }
}
