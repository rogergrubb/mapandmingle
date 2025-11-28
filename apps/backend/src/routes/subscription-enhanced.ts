import { Hono } from 'hono';
import Stripe from 'stripe';
import { requireUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const app = new Hono();

// Initialize Stripe with API key
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && stripeKey.startsWith('sk_') ? new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
}) : null;

// Price IDs for subscription tiers
const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_1Rzad0Q32c2nzfSVylNI1a5t',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1RzaeGQ32c2nzfSVKMBqzzWG',
};

/**
 * Create a checkout session for subscription with 30-day free trial
 * POST /api/subscription/create-checkout
 * Body: { tier: 'basic' | 'premium' }
 */
app.post('/create-checkout', async (c) => {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503);
  }

  const userId = requireUserId(c);
  const { tier } = await c.req.json();

  if (!tier || !['basic', 'premium'].includes(tier)) {
    return c.json({ error: 'Invalid tier. Must be "basic" or "premium"' }, 400);
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save Stripe customer ID to database
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session with 30-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[tier as 'basic' | 'premium'],
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30, // 30-day free trial
        metadata: {
          userId: user.id,
          tier: tier,
        },
      },
      success_url: `${process.env.FRONTEND_URL || 'exp://'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'exp://'}?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier,
      },
    });

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get current subscription status
 * GET /api/subscription/status
 */
app.get('/status', async (c) => {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503);
  }

  const userId = requireUserId(c);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // If user has no subscription, return free tier
    if (!user.stripeSubscriptionId) {
      return c.json({
        tier: 'free',
        status: 'active',
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
      });
    }

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    return c.json({
      tier: user.subscriptionTier || 'free',
      status: subscription.status,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      inTrial: subscription.status === 'trialing',
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Cancel subscription (at end of billing period)
 * POST /api/subscription/cancel
 */
app.post('/cancel', async (c) => {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503);
  }

  const userId = requireUserId(c);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Cancel subscription at period end (not immediately)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return c.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(subscription.current_period_end * 1000),
    });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Reactivate a canceled subscription
 * POST /api/subscription/reactivate
 */
app.post('/reactivate', async (c) => {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503);
  }

  const userId = requireUserId(c);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return c.json({
      message: 'Subscription reactivated successfully',
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Subscription reactivation error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Create a portal session for managing subscription
 * POST /api/subscription/portal
 */
app.post('/portal', async (c) => {
  if (!stripe) {
    return c.json({ error: 'Stripe is not configured' }, 503);
  }

  const userId = requireUserId(c);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return c.json({ error: 'No Stripe customer found' }, 404);
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL || 'exp://',
    });

    return c.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Portal session creation error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { app as subscriptionRoutes };
