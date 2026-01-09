import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, PRICING_TIERS } from '@/lib/stripe';

export const runtime = 'edge';

interface CheckoutRequest {
  planId: string;
  userId?: string;
  userEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { planId, userId, userEmail } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Validate plan ID
    const tier = PRICING_TIERS[planId.toUpperCase() as keyof typeof PRICING_TIERS];
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Check if this plan has a Stripe price ID configured
    if (!('priceId' in tier) || !tier.priceId) {
      return NextResponse.json(
        { error: 'This plan is not available for purchase yet' },
        { status: 400 }
      );
    }

    // For MVP, we'll use a simple user identification
    // In production, this should come from your auth system (Clerk, Supabase Auth, etc.)
    const finalUserId = userId || `user_${Date.now()}`;
    const finalUserEmail = userEmail || `user_${Date.now()}@example.com`;

    // Get the app URL from environment or request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const successUrl = `${appUrl}/analyze?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/pricing?cancelled=true`;

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: tier.priceId,
      userId: finalUserId,
      userEmail: finalUserEmail,
      successUrl,
      cancelUrl,
      metadata: {
        planId: tier.id,
        planName: tier.name,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Stripe Checkout API',
    timestamp: new Date().toISOString(),
  });
}
