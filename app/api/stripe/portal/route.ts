import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';
import { getUserSubscription } from '@/lib/subscription';

export const runtime = 'edge';

interface PortalRequest {
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PortalRequest = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's subscription to retrieve Stripe customer ID
    const subscription = await getUserSubscription(userId);

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get the app URL from environment or request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/analyze`;

    // Create Stripe customer portal session
    const session = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Portal error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create portal session',
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
    service: 'Stripe Customer Portal API',
    timestamp: new Date().toISOString(),
  });
}
