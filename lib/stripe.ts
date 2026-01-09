import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'FlipFlow',
    version: '1.0.0',
  },
});

// Pricing tier configuration matching PROJECT_PLAN.md
export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    credits: 3,
    features: [
      '3 free analyses',
      'Basic AI insights',
      'Deal score 0-100',
      'Risk identification',
      'Limited opportunities',
    ],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter Pack',
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_STARTER,
    credits: 10,
    features: [
      '10 detailed analyses',
      'Never expires',
      'Full AI insights',
      'All features included',
      'No subscription',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRICE_UNLIMITED,
    credits: -1, // unlimited
    interval: 'month',
    features: [
      'Unlimited analyses',
      'Advanced AI insights',
      'Full valuation reports',
      'Priority support',
      'Export PDF reports',
      'Coming: Auto deal finder',
    ],
  },
  SCOUT_STARTER: {
    id: 'scout-starter',
    name: 'Scout Starter',
    price: 49,
    priceId: process.env.STRIPE_PRICE_SCOUT_STARTER,
    interval: 'month',
    features: [
      'Automated deal finding',
      '24/7 Flippa monitoring',
      'Real-time email alerts',
      'Custom search filters',
      'Up to 3 alert configurations',
      'Daily digest reports',
    ],
    phase: 2, // Coming in Phase 2
  },
  SCOUT_PRO: {
    id: 'scout-pro',
    name: 'Scout Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_SCOUT_PRO,
    interval: 'month',
    features: [
      'Everything in Scout Starter',
      'Unlimited alert configurations',
      'Advanced filtering & scoring',
      'Priority deal notifications',
      'API access',
      'Slack/Discord integration',
      'Dedicated support',
    ],
    phase: 2, // Coming in Phase 2
  },
} as const;

export type PricingTierId = keyof typeof PRICING_TIERS;

// Helper functions
export function getPricingTier(tierId: string) {
  return PRICING_TIERS[tierId.toUpperCase() as PricingTierId];
}

export function isSubscriptionTier(tierId: string): boolean {
  const tier = getPricingTier(tierId);
  return tier ? 'interval' in tier && tier.interval === 'month' : false;
}

export function isUnlimitedTier(tierId: string): boolean {
  const tier = getPricingTier(tierId);
  return tier ? tier.credits === -1 : false;
}

// Create Stripe checkout session
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: priceId.includes('price_') ? 'subscription' : 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      ...metadata,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return session;
}

// Create customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.items.data.price.product'],
  });

  return subscriptions.data;
}

// Check if subscription is active
export async function isSubscriptionActive(subscriptionId: string): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription.status === 'active' || subscription.status === 'trialing';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

// Create one-time payment for credits
export async function createCreditsPurchase({
  userId,
  userEmail,
  credits,
  amount,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  credits: number;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${credits} Analysis Credits`,
            description: `Purchase ${credits} FlipFlow analysis credits`,
            images: ['https://your-domain.com/credits-image.png'], // TODO: Add actual image
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      credits: credits.toString(),
      type: 'credits_purchase',
    },
  });

  return session;
}
