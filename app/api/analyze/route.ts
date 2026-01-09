import { NextRequest, NextResponse } from 'next/server';
import { analyzeFlippaListing } from '@/lib/analyzer';
import { getCurrentUser } from '@/lib/supabase';
import { saveAnalysis, getOrCreateUser } from '@/lib/db';
import { canPerformAnalysis, consumeAnalysisCredit } from '@/lib/subscription';

export const runtime = 'edge';
export const maxDuration = 60; // 60 seconds for analysis

interface AnalyzeRequest {
  url: string;
  listingData?: string;
  userId?: string; // Optional for direct user identification
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate Flippa URL
    const flippaRegex = /^https?:\/\/(www\.)?flippa\.com\/.+/i;
    if (!flippaRegex.test(body.url)) {
      return NextResponse.json(
        { error: 'Please provide a valid Flippa listing URL' },
        { status: 400 }
      );
    }

    // For MVP, we'll ask users to paste the listing details
    // In Phase 2, we'll automatically scrape the page
    if (!body.listingData || body.listingData.trim().length < 100) {
      return NextResponse.json(
        {
          error: 'Please provide listing details (revenue, traffic, description, etc.).\n\nTip: Copy the key details from the Flippa page including price, revenue, profit, traffic stats, and description.'
        },
        { status: 400 }
      );
    }

    // Check authentication and usage limits
    let userId: string | null = null;
    let remainingCredits: number | string | null = null;

    // Try to get user from auth or direct userId
    const currentUser = await getCurrentUser();
    if (currentUser) {
      userId = currentUser.id;

      // Ensure user exists in our database
      const dbUser = await getOrCreateUser(
        currentUser.email || '',
        currentUser.user_metadata?.name
      );

      // Check if user can perform analysis using new subscription system
      const canAnalyze = await canPerformAnalysis(dbUser.id);

      if (!canAnalyze.allowed) {
        return NextResponse.json(
          {
            error: 'Analysis limit reached',
            message: canAnalyze.reason || 'You have used all your free analyses. Please upgrade to continue.',
            code: 'NO_CREDITS',
            remainingCredits: canAnalyze.remainingCredits || 0,
          },
          { status: 402 } // Payment Required
        );
      }

      // Consume one analysis credit
      const creditResult = await consumeAnalysisCredit(dbUser.id);

      if (!creditResult.success) {
        return NextResponse.json(
          {
            error: 'Failed to process analysis',
            message: creditResult.error || 'Unable to consume analysis credit',
            code: 'CREDIT_ERROR',
          },
          { status: 500 }
        );
      }

      remainingCredits = creditResult.remainingCredits;
    } else if (body.userId) {
      // Fallback for direct userId (for testing or API usage)
      userId = body.userId;

      const canAnalyze = await canPerformAnalysis(userId);

      if (!canAnalyze.allowed) {
        return NextResponse.json(
          {
            error: 'Analysis limit reached',
            message: canAnalyze.reason,
            code: 'NO_CREDITS',
            remainingCredits: canAnalyze.remainingCredits || 0,
          },
          { status: 402 }
        );
      }

      const creditResult = await consumeAnalysisCredit(userId);
      if (!creditResult.success) {
        return NextResponse.json(
          {
            error: 'Failed to process analysis',
            message: creditResult.error,
            code: 'CREDIT_ERROR',
          },
          { status: 500 }
        );
      }

      remainingCredits = creditResult.remainingCredits;
    }

    // Analyze the listing
    const analysis = await analyzeFlippaListing(body.listingData, body.url);

    // Save analysis to database if user is authenticated
    if (userId) {
      try {
        await saveAnalysis(userId, body.url, {
          score: analysis.score,
          dealQuality: analysis.dealQuality,
          recommendation: analysis.recommendation,
          summary: analysis.summary,
          valuation: analysis.valuation,
          risks: analysis.risks,
          opportunities: analysis.opportunities,
          financials: analysis.financials,
          keyInsights: analysis.keyInsights,
        });
      } catch (dbError) {
        // Don't fail the request if DB save fails, just log it
        console.error('Failed to save analysis to database:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      credits: remainingCredits !== null ? {
        remaining: remainingCredits === -1 ? 'unlimited' : remainingCredits,
        unlimited: remainingCredits === -1,
      } : undefined,
    });

  } catch (error) {
    console.error('Analysis error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'FlipFlow Analyzer API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
