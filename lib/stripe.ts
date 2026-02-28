import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID!,
  agency_monthly: process.env.STRIPE_AGENCY_PRICE_ID!,
}

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with manual analysis',
    features: [
      '3 analyses per month',
      'FlipScore + red flags',
      'Growth opportunities',
      'Basic recommendations',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    description: 'For serious deal hunters',
    features: [
      '50 analyses per month',
      'Everything in Free',
      '3 Scout filters',
      'Email deal alerts',
      'Analysis history',
      'Export to CSV',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 99,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    description: 'For acquisition firms & brokers',
    features: [
      'Unlimited analyses',
      'Everything in Pro',
      '20 Scout filters',
      'Priority AI processing',
      'Team seats (coming soon)',
      'API access (coming soon)',
    ],
    cta: 'Start Agency',
    highlighted: false,
  },
]
