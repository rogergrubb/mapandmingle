import Stripe from 'stripe';

// Check if Stripe key is configured
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured - Stripe features will be disabled');
}

const stripe = stripeKey 
  ? new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
  : null;

const PRICE_IDS = {
  basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
  basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || '',
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
};

export class StripeService {
  /**
   * Check if Stripe is configured
   */
  private static checkStripe(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return stripe;
  }

  /**
   * Create a Stripe customer for a new user
   */
  static async createCustomer(email: string, name: string, userId: string): Promise<string> {
    const stripeClient = this.checkStripe();
    const customer = await stripeClient.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const stripeClient = this.checkStripe();
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url!;
  }

  /**
   * Create a billing portal session for subscription management
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const stripeClient = this.checkStripe();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    const stripeClient = this.checkStripe();
    await stripeClient.subscriptions.cancel(subscriptionId);
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripeClient = this.checkStripe();
    return await stripeClient.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Handle webhook events
   */
  static constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    const stripeClient = this.checkStripe();
    return stripeClient.webhooks.constructEvent(payload, signature, secret);
  }

  /**
   * Get price IDs for frontend
   */
  static getPriceIds() {
    return PRICE_IDS;
  }
}
