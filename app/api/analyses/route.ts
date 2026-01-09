import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase';
import { getAnalyses, getAnalysisById, getListings, hasAnalysisCredits, decrementUserCredits } from '@/lib/db';
import { getQueueInstance } from '@/lib/queue';
import type { AnalyzeJobData } from '@/lib/queue';

export const runtime = 'edge';

/**
 * GET /api/analyses
 * Fetch user's analysis history
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get analysis ID from query params (if fetching single analysis)
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (analysisId) {
      // Fetch single analysis
      const analysis = await getAnalysisById(analysisId);

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        analysis,
      });
    }

    // Fetch all user's analyses
    const analyses = await getAnalyses(user.id);

    return NextResponse.json({
      success: true,
      analyses,
      count: analyses.length,
    });

  } catch (error) {
    console.error('Error fetching analyses:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch analyses',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analyses/batch
 * Queue batch analysis for multiple listings
 *
 * Body:
 * {
 *   listingIds?: string[]    // Specific listing IDs to analyze
 *   filters?: {              // OR filter criteria to find listings
 *     min_score?: number
 *     max_price?: number
 *     category?: string
 *     limit?: number
 *   }
 *   analyzeUnscored?: boolean // Only analyze listings without existing analysis
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Check credits
    const hasCredits = await hasAnalysisCredits(user.id);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'No analysis credits remaining. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { listingIds, filters, analyzeUnscored = true } = body;

    let listingsToAnalyze: any[] = [];

    if (listingIds && Array.isArray(listingIds)) {
      // Analyze specific listings by ID
      const allListings = await getListings({ limit: 100 });
      listingsToAnalyze = allListings.filter(l => listingIds.includes(l.id));
    } else if (filters) {
      // Get listings matching filters
      listingsToAnalyze = await getListings({
        ...filters,
        limit: filters.limit || 20,
      });
    } else {
      // Default: get recent unanalyzed listings
      const allListings = await getListings({ limit: 50 });
      listingsToAnalyze = analyzeUnscored
        ? allListings.filter(l => !l.analysis)
        : allListings;
    }

    if (listingsToAnalyze.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No listings to analyze',
        queued: 0,
      });
    }

    // Queue analysis jobs
    const queue = getQueueInstance();
    const jobIds: string[] = [];

    for (const listing of listingsToAnalyze) {
      // Skip if already has analysis and analyzeUnscored is true
      if (analyzeUnscored && listing.analysis) {
        continue;
      }

      const listingDataStr = JSON.stringify({
        title: listing.title,
        url: listing.url,
        askingPrice: listing.asking_price,
        monthlyRevenue: listing.monthly_revenue,
        monthlyProfit: listing.monthly_profit,
        category: listing.category,
        description: listing.description?.substring(0, 2000),
      });

      const job = queue.add<AnalyzeJobData>('analyze', {
        listingId: listing.id,
        listingUrl: listing.url,
        listingData: listingDataStr,
        userId: user.id,
        notifyOnComplete: true,
      });

      jobIds.push(job.id);
    }

    // Decrement user credits for each analysis (if not unlimited)
    // Note: Pro users have unlimited (-1) credits
    const creditsUsed = jobIds.length;

    return NextResponse.json({
      success: true,
      message: `Queued ${jobIds.length} listings for analysis`,
      queued: jobIds.length,
      jobIds,
      estimatedTime: `${Math.ceil(jobIds.length * 10 / 60)} minutes`,
    });

  } catch (error) {
    console.error('Error queueing batch analysis:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to queue batch analysis',
      },
      { status: 500 }
    );
  }
}
