import { Context, Next } from 'hono';
import { prisma } from '../lib/prisma';
import { TrialService } from '../services/trial.service';

/**
 * Middleware to check usage limits before allowing actions
 */
export async function checkUsageLimit(action: 'pin' | 'mingle' | 'message') {
  return async (c: Context, next: Next) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { subscriptionStatus: true },
      });

      const subscriptionStatus = profile?.subscriptionStatus || 'expired';

      // Check if user can perform this action
      const check = await TrialService.canPerformAction(userId, action, subscriptionStatus);

      if (!check.allowed) {
        return c.json(
          {
            error: 'Limit exceeded',
            message: check.reason,
            action: action,
            upgradeRequired: subscriptionStatus === 'expired',
          },
          429
        );
      }

      // Record this action
      await TrialService.recordAction(userId, action);

      // Store remaining count in context for response
      (c as any).usageRemaining = check.remaining;

      return next();
    } catch (error) {
      console.error(`Usage limit check error for ${action}:`, error);
      return c.json({ error: 'Failed to check usage limits' }, 500);
    }
  };
}

/**
 * Check trial expiration before allowing access to features
 */
export async function checkTrialExpiration(c: Context, next: Next) {
  const userId = c.req.header('X-User-Id');
  if (!userId) return next();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    if (user?.subscriptionStatus === 'trialing' && user.trialEndsAt) {
      if (new Date() > user.trialEndsAt) {
        // Expire the trial
        await TrialService.expireTrial(userId);
      }
    }

    return next();
  } catch (error) {
    console.error('Trial expiration check error:', error);
    return next();
  }
}

/**
 * Get detailed usage information for a user
 */
export async function getUserUsageStats(userId: string) {
  try {
    const [metrics, profile, user] = await Promise.all([
      prisma.usageMetrics.findUnique({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!metrics) return null;

    const limits = TrialService.getFeatureLimits(profile?.subscriptionStatus || null);
    const trialDaysRemaining =
      profile?.subscriptionStatus === 'trialing' && user?.trialEndsAt
        ? Math.ceil(
            (user.trialEndsAt.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
          )
        : 0;

    return {
      subscriptionStatus: profile?.subscriptionStatus,
      subscriptionTier: user?.subscriptionTier,
      trialEndsAt: user?.trialEndsAt,
      trialDaysRemaining,
      usage: {
        pins: {
          today: metrics.pinsToday,
          thisMonth: metrics.pinsThisMonth,
          dailyLimit: limits.pinsPerDay,
          monthlyLimit: limits.pinsPerMonth,
          remainingToday: Math.max(0, limits.pinsPerDay - metrics.pinsToday),
          remainingThisMonth: Math.max(0, limits.pinsPerMonth - metrics.pinsThisMonth),
        },
        mingles: {
          today: metrics.minglestoday,
          thisMonth: metrics.minglesThisMonth,
          dailyLimit: limits.minglesPerDay,
          monthlyLimit: limits.minglesPerMonth,
          remainingToday: Math.max(0, limits.minglesPerDay - metrics.minglestoday),
          remainingThisMonth: Math.max(0, limits.minglesPerMonth - metrics.minglesThisMonth),
        },
        messages: {
          today: metrics.messagesToday,
          thisMonth: metrics.messagesThisMonth,
          dailyLimit: limits.messagesPerDay,
          monthlyLimit: limits.messagesPerMonth,
          remainingToday: Math.max(0, limits.messagesPerDay - metrics.messagesToday),
          remainingThisMonth: Math.max(0, limits.messagesPerMonth - metrics.messagesThisMonth),
        },
      },
      lastDailyReset: metrics.lastDailyReset,
      lastMonthlyReset: metrics.lastMonthlyReset,
    };
  } catch (error) {
    console.error('Failed to get user usage stats:', error);
    return null;
  }
}

/**
 * Check if a single action is allowed
 */
export async function isActionAllowed(
  userId: string,
  action: 'pin' | 'mingle' | 'message'
): Promise<boolean> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionStatus: true },
    });

    const subscriptionStatus = profile?.subscriptionStatus || 'expired';

    // Premium users can always act
    if (subscriptionStatus === 'active' || subscriptionStatus === 'premium') {
      return true;
    }

    const check = await TrialService.canPerformAction(userId, action, subscriptionStatus);
    return check.allowed;
  } catch (error) {
    console.error('Failed to check action allowance:', error);
    return false;
  }
}
