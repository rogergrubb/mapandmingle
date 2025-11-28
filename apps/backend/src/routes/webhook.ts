import { Hono } from 'hono';
import { prisma } from '../index';
import Stripe from 'stripe';

export const stripeWebhookRoutes = new Hono();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== 'sk_test_placeholder'
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

// POST /webhook/stripe - Stripe webhook handler
stripeWebhookRoutes.post('/stripe', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return c.json({ error: 'Missing signature or webhook secret' }, 400);
    }
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return c.json({ error: 'Invalid signature' }, 400);
    }
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer) {
          await prisma.profile.updateMany({
            where: { stripeCustomerId: session.customer as string },
            data: {
              subscriptionStatus: 'active',
              stripeSubscriptionId: session.subscription as string,
              subscriptionStartedAt: new Date(),
            },
          });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.profile.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status === 'active' ? 'active' : 'expired',
            subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.profile.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          },
        });
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await prisma.profile.updateMany({
            where: { stripeCustomerId: invoice.customer as string },
            data: { subscriptionStatus: 'expired' },
          });
          // TODO: Send payment failed email
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
