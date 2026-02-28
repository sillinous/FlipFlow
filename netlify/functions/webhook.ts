import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const TIER_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '']: 'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_SCOUT_PRICE_ID || '']: 'scout',
}

export const handler: Handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const sig = event.headers['stripe-signature']!
  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return { statusCode: 400, body: 'Webhook signature verification failed' }
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.CheckoutSession
    const userId = session.metadata?.user_id
    const subscriptionId = session.subscription as string
    if (userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0]?.price.id || ''
      const tier = TIER_MAP[priceId] || 'starter'
      await admin.from('profiles').update({ subscription_tier: tier, stripe_subscription_id: subscriptionId, stripe_customer_id: session.customer as string }).eq('id', userId)
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const sub = stripeEvent.data.object as Stripe.Subscription
    await admin.from('profiles').update({ subscription_tier: 'free' }).eq('stripe_subscription_id', sub.id)
  }

  return { statusCode: 200, body: 'ok' }
}
