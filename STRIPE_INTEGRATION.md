# Stripe Payment Integration - FlipFlow

This document details the complete Stripe payment integration for FlipFlow, including setup instructions, architecture, and usage.

## Table of Contents

1. [Overview](#overview)
2. [Pricing Structure](#pricing-structure)
3. [Setup Instructions](#setup-instructions)
4. [Architecture](#architecture)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## Overview

FlipFlow uses Stripe for payment processing with the following features:

- **Subscriptions**: Monthly recurring billing for unlimited plans
- **One-time payments**: Pay-as-you-go credit packs
- **Usage tracking**: Credit-based system with automatic limits
- **Customer portal**: Self-service subscription management
- **Webhook processing**: Automated subscription updates

---

## Pricing Structure

### Phase 1: FlipScore Analyzer

| Plan | Price | Credits | Type |
|------|-------|---------|------|
| **Free** | $0 | 3 analyses | Free tier |
| **Starter** | $9.99 | 10 analyses | One-time |
| **Pro** | $49/month | Unlimited | Subscription |

### Phase 2: Scout Agent (Coming February 2026)

| Plan | Price | Features | Type |
|------|-------|----------|------|
| **Scout Starter** | $49/month | 3 alerts, automated monitoring | Subscription |
| **Scout Pro** | $99/month | Unlimited alerts, API access | Subscription |

---

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up your products and prices:

#### Create Products in Stripe Dashboard

**Product 1: Starter Pack (One-time)**
- Name: "FlipFlow Starter Pack"
- Description: "10 detailed analysis credits"
- Price: $9.99 (one-time payment)
- Copy the Price ID (e.g., `price_xxx`)

**Product 2: Pro Plan (Subscription)**
- Name: "FlipFlow Pro"
- Description: "Unlimited analyses"
- Price: $49/month (recurring monthly)
- Copy the Price ID (e.g., `price_xxx`)

**Product 3: Scout Starter (Coming Soon)**
- Name: "FlipFlow Scout Starter"
- Price: $49/month (recurring monthly)
- Copy the Price ID

**Product 4: Scout Pro (Coming Soon)**
- Name: "FlipFlow Scout Pro"
- Price: $99/month (recurring monthly)
- Copy the Price ID

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxx              # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Your publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxx            # Webhook signing secret

# Stripe Price IDs (from products created above)
STRIPE_PRICE_STARTER=price_xxx             # $9.99 one-time
STRIPE_PRICE_UNLIMITED=price_xxx           # $49/month Pro
STRIPE_PRICE_SCOUT_STARTER=price_xxx       # $49/month Scout (Phase 2)
STRIPE_PRICE_SCOUT_PRO=price_xxx          # $99/month Scout Pro (Phase 2)
```

### 3. Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Database Setup

Ensure your Supabase database has the required columns in the `users` table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
```

---

## Architecture

### File Structure

```
lib/
  ├── stripe.ts              # Server-side Stripe config & helpers
  ├── stripe-client.ts       # Client-side Stripe integration
  └── subscription.ts        # Subscription management logic

app/api/stripe/
  ├── checkout/route.ts      # Create checkout sessions
  ├── webhook/route.ts       # Handle Stripe webhooks
  └── portal/route.ts        # Customer portal redirect

app/pricing/
  └── page.tsx              # Pricing page

components/
  ├── PricingCard.tsx       # Pricing tier card component
  └── UpgradeButton.tsx     # Upgrade CTA button

types/
  ├── stripe.ts             # Stripe-specific TypeScript types
  └── index.ts              # Main types export
```

### Key Components

#### 1. `lib/stripe.ts` (Server-side)

Server-side Stripe SDK initialization and helper functions:

- `stripe` - Initialized Stripe client
- `PRICING_TIERS` - Pricing tier configuration
- `createCheckoutSession()` - Create payment/subscription session
- `createPortalSession()` - Open customer portal
- `getCustomerSubscriptions()` - Fetch active subscriptions
- `isSubscriptionActive()` - Check subscription status

#### 2. `lib/stripe-client.ts` (Client-side)

Browser-side Stripe.js integration:

- `getStripe()` - Load Stripe.js library
- `purchasePlan()` - Initiate checkout flow
- `openCustomerPortal()` - Open subscription management

#### 3. `lib/subscription.ts` (Usage Management)

Subscription and usage tracking:

- `getUserSubscription()` - Get user's current plan
- `canPerformAnalysis()` - Check if user can analyze
- `consumeAnalysisCredit()` - Deduct one credit
- `updateUserSubscription()` - Update after payment
- `addCredits()` - Add credits from one-time purchase

### Payment Flows

#### Flow 1: One-time Purchase (Starter Pack)

```
1. User clicks "Buy Credits" on Pricing page
2. PricingCard calls purchasePlan('starter')
3. POST /api/stripe/checkout creates session
4. User redirected to Stripe Checkout
5. User completes payment
6. Stripe fires checkout.session.completed webhook
7. Webhook handler adds 10 credits to user account
8. User redirected to /analyze?success=true
```

#### Flow 2: Subscription Purchase (Pro Plan)

```
1. User clicks "Get Started" on Pro plan
2. PricingCard calls purchasePlan('pro')
3. POST /api/stripe/checkout creates subscription session
4. User redirected to Stripe Checkout
5. User enters payment details
6. Stripe creates subscription and fires webhooks
7. customer.subscription.created webhook updates user to Pro
8. User gets unlimited analyses
9. invoice.paid webhook resets monthly usage
```

#### Flow 3: Subscription Management

```
1. User clicks "Manage Subscription" button
2. UpgradeButton calls openCustomerPortal()
3. POST /api/stripe/portal creates portal session
4. User redirected to Stripe Customer Portal
5. User can update payment, cancel, etc.
6. Changes trigger webhooks to update database
```

### Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Add credits for one-time purchases |
| `customer.subscription.created` | Activate subscription, grant unlimited access |
| `customer.subscription.updated` | Update subscription details |
| `customer.subscription.deleted` | Cancel subscription, revert to free tier |
| `invoice.paid` | Reset monthly usage counter |
| `invoice.payment_failed` | Log error, notify user (TODO: email) |

---

## Testing

### Test Mode Setup

1. Use Stripe test keys (they start with `sk_test_` and `pk_test_`)
2. Test credit cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Test Scenarios

1. **Free Trial Flow**
   - Sign up → Get 3 free analyses
   - Use all 3 → See upgrade prompt
   - Try to analyze → Get error "No credits"

2. **One-time Purchase**
   - Click "Buy Credits" ($9.99)
   - Complete payment
   - Verify 10 credits added
   - Use credits, verify count decreases

3. **Subscription Flow**
   - Purchase Pro plan ($49/mo)
   - Verify unlimited analyses
   - Use multiple analyses, count stays unlimited
   - Open customer portal, verify details

4. **Subscription Cancellation**
   - Cancel from customer portal
   - Verify access until period end
   - After period ends, revert to free tier

---

## Deployment

### Production Checklist

- [ ] Switch to Stripe live keys (`sk_live_`, `pk_live_`)
- [ ] Create live products and prices
- [ ] Update environment variables in Vercel
- [ ] Configure production webhook endpoint
- [ ] Test end-to-end payment flow in production
- [ ] Set up email notifications for payment failures
- [ ] Enable Stripe fraud prevention (Radar)
- [ ] Set up billing alerts in Stripe Dashboard
- [ ] Add Terms of Service and Privacy Policy links
- [ ] Configure refund policy

### Environment Variables (Production)

```bash
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
STRIPE_PRICE_STARTER=price_live_xxx
STRIPE_PRICE_UNLIMITED=price_live_xxx
NEXT_PUBLIC_APP_URL=https://flipflow.ai
```

### Webhook Configuration (Production)

Endpoint: `https://your-domain.com/api/stripe/webhook`

Events to listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Monitoring

Monitor these metrics in Stripe Dashboard:

- Daily/Monthly Revenue (MRR)
- Subscription churn rate
- Failed payments
- Successful checkouts
- Webhook delivery success rate

---

## Usage Examples

### Client-Side: Purchase a Plan

```typescript
import { purchasePlan } from '@/lib/stripe-client';

// Trigger checkout
await purchasePlan('pro'); // Redirects to Stripe Checkout
```

### Server-Side: Check User's Plan

```typescript
import { getUserSubscription, canPerformAnalysis } from '@/lib/subscription';

// Get subscription details
const subscription = await getUserSubscription(userId);
console.log(subscription.planId); // 'free', 'starter', 'pro'

// Check if user can analyze
const canAnalyze = await canPerformAnalysis(userId);
if (!canAnalyze.allowed) {
  return { error: canAnalyze.reason };
}
```

### Consume Analysis Credit

```typescript
import { consumeAnalysisCredit } from '@/lib/subscription';

const result = await consumeAnalysisCredit(userId);
if (result.success) {
  console.log(`Remaining: ${result.remainingCredits}`);
}
```

---

## Troubleshooting

### Common Issues

**Issue**: Webhook not receiving events
- Solution: Check webhook endpoint URL, verify signing secret, check Stripe logs

**Issue**: Payment succeeds but credits not added
- Solution: Check webhook logs, verify database connection, check Supabase service key

**Issue**: "No Stripe price ID configured"
- Solution: Ensure all STRIPE_PRICE_* environment variables are set

**Issue**: Subscription shows as active but user can't analyze
- Solution: Check `subscription_status` in database, verify webhook processed correctly

---

## Support & Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js + Stripe Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)

---

## Future Enhancements

- [ ] Add annual billing (20% discount)
- [ ] Implement promo codes and discounts
- [ ] Add usage-based billing for API access
- [ ] Integrate with Resend for payment emails
- [ ] Add analytics dashboard for subscription metrics
- [ ] Implement dunning management for failed payments
- [ ] Add gift cards and team subscriptions
