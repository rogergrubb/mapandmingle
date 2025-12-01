import { prisma } from '../lib/prisma';

const FREE_TIER_LIMITS = {
  pinsPerDay: 3,
  pinsPerMonth: 50,
  minglesPerDay: 2,
  minglesPerMonth: 20,
  messagesPerDay: 20,
  messagesPerMonth: 1000,
};

const TRIAL_TIER_LIMITS = {
  pinsPerDay: 50,
  pinsPerMonth: 500,
  minglesPerDay: 20,
  minglesPerMonth: 200,
  messagesPerDay: 1000,
  messagesPerMonth: 10000,
};

const TRIAL_DURATION_DAYS = 14;

export class TrialService {
  /**
   * Initialize 14-day trial for new users
   */
  static async initializeTrial(userId: string) {
    try {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

      await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'trialing',
            subscriptionTier: 'trial',
            trialEndsAt,
          },
        }),
        prisma.usageMetrics.create({
          data: {
            userId,
            pinsToday: 0,
            pinsThisMonth: 0,
            minglestoday: 0,
            minglesThisMonth: 0,
            messagesToday: 0,
            messagesThisMonth: 0,
            lastDailyReset: now,
            lastMonthlyReset: now,
          },
        }),
      ]);

      console.log(`Trial initialized for user ${userId}, expires at ${trialEndsAt}`);
    } catch (error) {
      console.error(`Failed to initialize trial for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if trial has expired
   */
  static async isTrialExpired(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true, subscriptionStatus: true },
    });

    if (!user || user.subscriptionStatus !== 'trialing' || !user.trialEndsAt) {
      return false;
    }

    return new Date() > user.trialEndsAt;
  }

  /**
   * Get remaining trial days
   */
  static async getTrialDaysRemaining(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true, subscriptionStatus: true },
    });

    if (!user || user.subscriptionStatus !== 'trialing' || !user.trialEndsAt) {
      return 0;
    }

    const now = new Date();
    if (now > user.trialEndsAt) {
      return 0;
    }

    const daysRemaining = Math.ceil(
      (user.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.max(0, daysRemaining);
  }

  /**
   * Expire trial and convert to free tier
   */
  static async expireTrial(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'expired',
          subscriptionTier: 'free',
        },
      });

      console.log(`Trial expired for user ${userId}, converted to free tier`);
    } catch (error) {
      console.error(`Failed to expire trial for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get feature limits based on subscription tier
   */
  static getFeatureLimits(subscriptionStatus: string | null) {
    if (subscriptionStatus === 'trialing') {
      return TRIAL_TIER_LIMITS;
    }
    return FREE_TIER_LIMITS;
  }

  /**
   * Check if user can perform action
   */
  static async canPerformAction(
    userId: string,
    action: 'pin' | 'mingle' | 'message',
    subscriptionStatus: string
  ): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    // Premium users (active subscription) have no limits
    if (subscriptionStatus === 'active' || subscriptionStatus === 'premium') {
      return { allowed: true };
    }

    const limits = TrialService.getFeatureLimits(subscriptionStatus);
    const metrics = await prisma.usageMetrics.findUnique({ where: { userId } });

    if (!metrics) {
      return { allowed: false, reason: 'Usage metrics not found' };
    }

    // Reset counters if needed
    await TrialService.checkAndResetCounters(userId, metrics);

    switch (action) {
      case 'pin':
        if (metrics.pinsToday >= limits.pinsPerDay) {
          return {
            allowed: false,
            reason: `Daily pin limit reached (${limits.pinsPerDay})`,
            remaining: 0,
          };
        }
        if (metrics.pinsThisMonth >= limits.pinsPerMonth) {
          return {
            allowed: false,
            reason: `Monthly pin limit reached (${limits.pinsPerMonth})`,
            remaining: 0,
          };
        }
        return {
          allowed: true,
          remaining: Math.min(
            limits.pinsPerDay - metrics.pinsToday,
            limits.pinsPerMonth - metrics.pinsThisMonth
          ),
        };

      case 'mingle':
        if (metrics.minglestoday >= limits.minglesPerDay) {
          return {
            allowed: false,
            reason: `Daily mingle limit reached (${limits.minglesPerDay})`,
            remaining: 0,
          };
        }
        if (metrics.minglesThisMonth >= limits.minglesPerMonth) {
          return {
            allowed: false,
            reason: `Monthly mingle limit reached (${limits.minglesPerMonth})`,
            remaining: 0,
          };
        }
        return {
          allowed: true,
          remaining: Math.min(
            limits.minglesPerDay - metrics.minglestoday,
            limits.minglesPerMonth - metrics.minglesThisMonth
          ),
        };

      case 'message':
        if (metrics.messagesToday >= limits.messagesPerDay) {
          return {
            allowed: false,
            reason: `Daily message limit reached (${limits.messagesPerDay})`,
            remaining: 0,
          };
        }
        return {
          allowed: true,
          remaining: limits.messagesPerDay - metrics.messagesToday,
        };

      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  }

  /**
   * Record action usage
   */
  static async recordAction(userId: string, action: 'pin' | 'mingle' | 'message') {
    try {
      const updateData: any = {};

      switch (action) {
        case 'pin':
          updateData.pinsToday = { increment: 1 };
          updateData.pinsThisMonth = { increment: 1 };
          break;
        case 'mingle':
          updateData.minglestoday = { increment: 1 };
          updateData.minglesThisMonth = { increment: 1 };
          break;
        case 'message':
          updateData.messagesToday = { increment: 1 };
          updateData.messagesThisMonth = { increment: 1 };
          break;
      }

      await prisma.usageMetrics.update({
        where: { userId },
        data: updateData,
      });
    } catch (error) {
      console.error(`Failed to record action for user ${userId}:`, error);
    }
  }

  /**
   * Reset daily limits at UTC midnight
   */
  static async resetDailyLimits(userId: string) {
    await prisma.usageMetrics.update({
      where: { userId },
      data: {
        pinsToday: 0,
        minglestoday: 0,
        messagesToday: 0,
        lastDailyReset: new Date(),
      },
    });
  }

  /**
   * Reset monthly limits on 1st of month
   */
  static async resetMonthlyLimits(userId: string) {
    await prisma.usageMetrics.update({
      where: { userId },
      data: {
        pinsThisMonth: 0,
        minglesThisMonth: 0,
        messagesThisMonth: 0,
        lastMonthlyReset: new Date(),
      },
    });
  }

  /**
   * Check and reset counters if needed
   */
  private static async checkAndResetCounters(
    userId: string,
    metrics: any
  ) {
    const now = new Date();
    const lastDaily = new Date(metrics.lastDailyReset);
    const lastMonthly = new Date(metrics.lastMonthlyReset);

    // Check if daily reset needed
    if (
      now.getUTCDate() !== lastDaily.getUTCDate() ||
      now.getUTCMonth() !== lastDaily.getUTCMonth()
    ) {
      await TrialService.resetDailyLimits(userId);
    }

    // Check if monthly reset needed
    if (now.getUTCMonth() !== lastMonthly.getUTCMonth()) {
      await TrialService.resetMonthlyLimits(userId);
    }
  }
}
