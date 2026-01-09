import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateUserSubscription, addCredits, resetMonthlyUsage, cancelUserSubscription } from '@/lib/subscription';
import Stripe from 'stripe';

export const runtime = 'nodejs'; // Webhooks need nodejs runtime for raw body access

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(request: NextRequest): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No body available');
  }

  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = doneReading;
  }

  const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  return buffer.toString('utf8');
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    // Get the raw body and signature
    const body = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      // One-time payment completed (for credit purchases)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'payment') {
          // This is a one-time credit purchase
          const userId = session.client_reference_id || session.metadata?.userId;
          const credits = parseInt(session.metadata?.credits || '0');

          if (userId && credits > 0) {
            await addCredits(userId, credits);
            console.log(`Added ${credits} credits to user ${userId}`);
          }
        } else if (session.mode === 'subscription') {
          // Subscription created - will be handled by subscription.created event
          console.log('Subscription checkout completed:', session.id);
        }
        break;
      }

      // New subscription created
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const customer = typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

          // Get customer email
          const customerData = await stripe.customers.retrieve(customer);
          const email = 'email' in customerData ? customerData.email : null;

          if (email) {
            await updateUserSubscription({
              userId,
              email,
              planId: subscription.metadata?.planId || 'pro',
              stripeCustomerId: customer,
              stripeSubscriptionId: subscription.id,
              status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'cancelled',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });

            console.log(`Updated subscription for user ${userId}`);
          }
        }
        break;
      }

      // Subscription deleted/cancelled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await cancelUserSubscription(userId, false);
          console.log(`Cancelled subscription for user ${userId}`);
        }
        break;
      }

      // Invoice paid (for recurring subscriptions)
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Reset monthly usage for unlimited plans
            await resetMonthlyUsage(userId);
            console.log(`Reset monthly usage for user ${userId}`);
          }
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;

          console.error(`Payment failed for user ${userId}, subscription ${subscriptionId}`);

          // TODO: Send email notification to user about failed payment
          // You can integrate with Resend here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Stripe Webhook Handler',
    timestamp: new Date().toISOString(),
  });
}
