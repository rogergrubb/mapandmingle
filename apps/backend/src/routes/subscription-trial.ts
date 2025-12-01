import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { getUserUsageStats } from '../middleware/usageLimits';
import { TrialService } from '../services/trial.service';

const subscriptionRoutes = new Hono();

/**
 * GET /api/subscription/info
 * Get complete subscription and usage info
 */
subscriptionRoutes.get('/info', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const [user, usageStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          trialEndsAt: true,
          subscriptionEnd: true,
        },
      }),
      getUserUsageStats(userId),
    ]);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        trialEndsAt: user.trialEndsAt,
        subscriptionEnd: user.subscriptionEnd,
      },
      usage: usageStats?.usage,
      trialDaysRemaining: usageStats?.trialDaysRemaining,
    });
  } catch (error) {
    console.error('Failed to get subscription info:', error);
    return c.json({ error: 'Failed to get subscription info' }, 500);
  }
});

/**
 * GET /api/subscription/status
 * Get basic subscription status (legacy endpoint)
 */
subscriptionRoutes.get('/status', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        isPremium: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      isPremium: user.isPremium,
      trialEndsAt: user.trialEndsAt,
    });
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return c.json({ error: 'Failed to get subscription status' }, 500);
  }
});

/**
 * GET /api/subscription/usage
 * Get detailed usage breakdown
 */
subscriptionRoutes.get('/usage', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const usageStats = await getUserUsageStats(userId);

    if (!usageStats) {
      return c.json({ error: 'Usage stats not found' }, 404);
    }

    return c.json(usageStats);
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return c.json({ error: 'Failed to get usage stats' }, 500);
  }
});

/**
 * POST /api/subscription/checkout
 * Create Stripe checkout session (existing implementation)
 */
subscriptionRoutes.post('/checkout', async (c) => {
  // This endpoint should already exist in your code
  // Implementation depends on your existing Stripe integration
  return c.json({ error: 'Not implemented' }, 501);
});

/**
 * POST /api/subscription/cancel
 * Cancel subscription
 */
subscriptionRoutes.post('/cancel', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Update user to free tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionTier: 'free',
        stripeSubscriptionId: null,
      },
    });

    return c.json({
      message: 'Subscription cancelled successfully',
      subscriptionStatus: 'canceled',
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

/**
 * POST /api/subscription/portal
 * Get Stripe customer portal link
 */
subscriptionRoutes.post('/portal', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return c.json({ error: 'No Stripe customer found' }, 404);
    }

    // This should call your Stripe API to create a portal session
    // Implementation depends on your existing Stripe integration
    return c.json({ error: 'Not implemented' }, 501);
  } catch (error) {
    console.error('Failed to get portal link:', error);
    return c.json({ error: 'Failed to get portal link' }, 500);
  }
});

export default subscriptionRoutes;
