import { prisma } from '../lib/prisma';
import { TrialService } from '../services/trial.service';

/**
 * Reset daily limits for all users at UTC midnight
 * Call this via scheduled task (Cloud Scheduler)
 */
export async function resetDailyLimitsForAllUsers() {
  try {
    console.log('🔄 Starting daily limit reset...');

    const metrics = await prisma.usageMetrics.findMany();
    let resetCount = 0;

    for (const metric of metrics) {
      try {
        await TrialService.resetDailyLimits(metric.userId);
        resetCount++;
      } catch (error) {
        console.error(`Failed to reset daily limits for user ${metric.userId}:`, error);
      }
    }

    console.log(`✅ Daily limits reset for ${resetCount} users`);
    return { success: true, usersReset: resetCount };
  } catch (error) {
    console.error('Failed to reset daily limits:', error);
    throw error;
  }
}

/**
 * Reset monthly limits for all users on the 1st of the month
 * Call this via scheduled task (Cloud Scheduler)
 */
export async function resetMonthlyLimitsForAllUsers() {
  try {
    console.log('🔄 Starting monthly limit reset...');

    const metrics = await prisma.usageMetrics.findMany();
    let resetCount = 0;

    for (const metric of metrics) {
      try {
        await TrialService.resetMonthlyLimits(metric.userId);
        resetCount++;
      } catch (error) {
        console.error(`Failed to reset monthly limits for user ${metric.userId}:`, error);
      }
    }

    console.log(`✅ Monthly limits reset for ${resetCount} users`);
    return { success: true, usersReset: resetCount };
  } catch (error) {
    console.error('Failed to reset monthly limits:', error);
    throw error;
  }
}

/**
 * Expire all expired trials and convert to free tier
 * Call this daily via scheduled task (Cloud Scheduler)
 */
export async function expireExpiredTrials() {
  try {
    console.log('🔄 Starting trial expiration check...');

    const users = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'trialing',
        trialEndsAt: {
          lt: new Date(), // Past date
        },
      },
      select: { id: true },
    });

    let expiredCount = 0;

    for (const user of users) {
      try {
        await TrialService.expireTrial(user.id);
        expiredCount++;
      } catch (error) {
        console.error(`Failed to expire trial for user ${user.id}:`, error);
      }
    }

    console.log(`✅ ${expiredCount} trials expired`);
    return { success: true, trialsExpired: expiredCount };
  } catch (error) {
    console.error('Failed to expire trials:', error);
    throw error;
  }
}

/**
 * Initialize usage metrics for existing users (one-time setup)
 */
export async function initializeUsageMetricsForExistingUsers() {
  try {
    console.log('🔄 Initializing usage metrics for existing users...');

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    let initCount = 0;

    for (const user of users) {
      try {
        const existing = await prisma.usageMetrics.findUnique({
          where: { userId: user.id },
        });

        if (!existing) {
          const now = new Date();
          await prisma.usageMetrics.create({
            data: {
              userId: user.id,
              pinsToday: 0,
              pinsThisMonth: 0,
              minglestoday: 0,
              minglesThisMonth: 0,
              messagesToday: 0,
              messagesThisMonth: 0,
              lastDailyReset: now,
              lastMonthlyReset: now,
            },
          });
          initCount++;
        }
      } catch (error) {
        console.error(`Failed to initialize metrics for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Usage metrics initialized for ${initCount} users`);
    return { success: true, usersInitialized: initCount };
  } catch (error) {
    console.error('Failed to initialize usage metrics:', error);
    throw error;
  }
}

/**
 * Get aggregate subscription statistics
 */
export async function getAggregateSubscriptionStats() {
  try {
    const stats = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    });

    const trialCount = await prisma.user.count({
      where: { subscriptionStatus: 'trialing' },
    });

    const activeSubscriptions = await prisma.user.count({
      where: { subscriptionStatus: 'active' },
    });

    return {
      byTier: stats,
      trialing: trialCount,
      active: activeSubscriptions,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Failed to get subscription stats:', error);
    throw error;
  }
}

/**
 * Clean up rate limit logs (keep only last 7 days)
 */
export async function cleanupRateLimitLogs() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.rateLimitLog.deleteMany({
      where: {
        timestamp: {
          lt: sevenDaysAgo,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} old rate limit logs`);
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('Failed to cleanup rate limit logs:', error);
    throw error;
  }
}

/**
 * Get usage analytics for a specific date range
 */
export async function getUsageAnalytics(startDate: Date, endDate: Date) {
  try {
    const logs = await prisma.rateLimitLog.groupBy({
      by: ['userId', 'endpoint'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return {
      period: { startDate, endDate },
      requestsByEndpoint: logs,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Failed to get usage analytics:', error);
    throw error;
  }
}
