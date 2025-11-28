import { Hono } from 'hono';
import { prisma } from '../index';
import Stripe from 'stripe';

export const subscriptionRoutes = new Hono();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== 'sk_test_placeholder' 
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

// GET /api/subscription/status - Get subscription status
subscriptionRoutes.get('/status', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    let trialDaysRemaining = null;
    if (profile.subscriptionStatus === 'trial' && profile.subscriptionExpiresAt) {
      const remaining = profile.subscriptionExpiresAt.getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
    }
    
    return c.json({
      status: profile.subscriptionStatus,
      trialDaysRemaining,
      expiresAt: profile.subscriptionExpiresAt?.toISOString(),
      features: profile.subscriptionStatus === 'active' || profile.subscriptionStatus === 'trial'
        ? ['ghost_mode', 'selective_visibility', 'video_calls', 'group_rooms', 'proximity_alerts', 'boost', 'unlimited_pins']
        : ['basic_messaging', 'limited_pins'],
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch status' }, 500);
  }
});

// POST /api/subscription/checkout - Create Stripe checkout session
subscriptionRoutes.post('/checkout', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    // Create or get Stripe customer
    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.profile.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    }
    
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }
    
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/api/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/cancelled`,
    });
    
    return c.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ error: 'Failed to create checkout' }, 500);
  }
});

// GET /api/subscription/success - Handle successful checkout
subscriptionRoutes.get('/success', async (c) => {
  try {
    const sessionId = c.req.query('session_id');
    if (!sessionId) return c.json({ error: 'Missing session ID' }, 400);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session.customer) return c.json({ error: 'No customer' }, 400);
    
    // Find user by Stripe customer ID
    const profile = await prisma.profile.findFirst({
      where: { stripeCustomerId: session.customer as string },
    });
    
    if (!profile) return c.json({ error: 'Profile not found' }, 404);
    
    // Update subscription status
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        subscriptionStatus: 'active',
        stripeSubscriptionId: session.subscription as string,
        subscriptionStartedAt: new Date(),
        subscriptionExpiresAt: null, // Will be set by webhook
      },
    });
    
    return c.redirect('/subscription/success');
  } catch (error) {
    return c.json({ error: 'Failed to process success' }, 500);
  }
});

// POST /api/subscription/cancel - Cancel subscription
subscriptionRoutes.post('/cancel', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile?.stripeSubscriptionId) {
      return c.json({ error: 'No active subscription' }, 400);
    }
    
    await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
    
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to cancel' }, 500);
  }
});

// POST /api/subscription/portal - Create customer portal session
subscriptionRoutes.post('/portal', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile?.stripeCustomerId) {
      return c.json({ error: 'No Stripe customer' }, 400);
    }
    
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${baseUrl}/profile`,
    });
    
    return c.json({ portalUrl: session.url });
  } catch (error) {
    return c.json({ error: 'Failed to create portal' }, 500);
  }
});
