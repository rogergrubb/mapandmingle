import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { StripeService } from '../services/stripe.service';
import { EmailService } from '../services/email.service';

export const paymentRoutes = new Hono();

/**
 * Create checkout session for subscription
 * POST /api/payments/create-checkout
 */
paymentRoutes.post('/create-checkout', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { priceId, plan } = await c.req.json();

    if (!priceId || !plan) {
      return c.json({ error: 'Missing priceId or plan' }, 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await StripeService.createCustomer(
        user.email,
        user.name || user.email,
        user.id
      );

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const checkoutUrl = await StripeService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${process.env.FRONTEND_URL}/subscription/success`,
      `${process.env.FRONTEND_URL}/subscription/cancel`
    );

    return c.json({ checkoutUrl });
  } catch (error) {
    console.error('Create checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

/**
 * Create billing portal session
 * POST /api/payments/billing-portal
 */
paymentRoutes.post('/billing-portal', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    const portalUrl = await StripeService.createBillingPortalSession(
      user.stripeCustomerId,
      `${process.env.FRONTEND_URL}/settings/subscription`
    );

    return c.json({ portalUrl });
  } catch (error) {
    console.error('Billing portal error:', error);
    return c.json({ error: 'Failed to create billing portal session' }, 500);
  }
});

/**
 * Get subscription status
 * GET /api/payments/subscription
 */
paymentRoutes.get('/subscription', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeSubscriptionId) {
      return c.json({ subscription: null });
    }

    const subscription = await StripeService.getSubscription(user.stripeSubscriptionId);

    return c.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan: subscription.items.data[0]?.price.id,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

/**
 * Stripe webhook handler
 * POST /api/payments/webhook
 */
paymentRoutes.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'No signature' }, 400);
    }

    const body = await c.req.text();
    const event = StripeService.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Update user with subscription
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              subscriptionTier: session.metadata?.plan || 'basic',
            },
          });

          console.log(`✅ Subscription activated for user ${user.id}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: subscription.status === 'active' ? (user.subscriptionTier || 'basic') : null,
            },
          });

          console.log(`✅ Subscription updated for user ${user.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeSubscriptionId: null,
              subscriptionTier: null,
            },
          });

          console.log(`✅ Subscription cancelled for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          // Send email notification about failed payment
          console.log(`⚠️ Payment failed for user ${user.id}`);
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook handler failed' }, 500);
  }
});

/**
 * Get price IDs for frontend
 * GET /api/payments/prices
 */
paymentRoutes.get('/prices', async (c) => {
  try {
    const prices = StripeService.getPriceIds();
    return c.json({ prices });
  } catch (error) {
    console.error('Get prices error:', error);
    return c.json({ error: 'Failed to get prices' }, 500);
  }
});

export default paymentRoutes;
