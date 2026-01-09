/**
 * FlipFlow - Scheduled Analysis Cron Endpoint
 *
 * This endpoint analyzes listings that don't have analysis yet.
 * Designed to be called after scraping to process new listings.
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/analyze",
 *     "schedule": "30 */6 * * *"  // 30 mins after scrape
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueInstance } from '@/lib/queue';
import { getListings } from '@/lib/db';
import type { AnalyzeJobData } from '@/lib/queue';

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_ANALYSES_PER_RUN = 10; // Limit to control API costs

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret === CRON_SECRET) {
    return true;
  }

  if (process.env.NODE_ENV === 'development' && !CRON_SECRET) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      console.warn('Unauthorized cron analyze request attempted');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled analysis job...');

    // Get listings without analysis
    const allListings = await getListings({ limit: 100 });
    const unanalyzedListings = allListings.filter(l => !l.analysis);

    if (unanalyzedListings.length === 0) {
      console.log('No unanalyzed listings found');
      return NextResponse.json({
        success: true,
        message: 'No listings to analyze',
        queued: 0,
      });
    }

    // Limit the number of analyses per run
    const listingsToAnalyze = unanalyzedListings.slice(0, MAX_ANALYSES_PER_RUN);

    console.log(`Found ${unanalyzedListings.length} unanalyzed listings, processing ${listingsToAnalyze.length}`);

    // Queue analysis jobs
    const queue = getQueueInstance();
    const jobIds: string[] = [];

    for (const listing of listingsToAnalyze) {
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
        notifyOnComplete: false,
      }, {
        priority: 3,
        metadata: {
          triggeredBy: 'cron',
          triggeredAt: new Date().toISOString(),
        },
      });

      jobIds.push(job.id);
    }

    console.log(`Queued ${jobIds.length} analysis jobs`);

    return NextResponse.json({
      success: true,
      message: `Queued ${jobIds.length} listings for analysis`,
      queued: jobIds.length,
      remaining: unanalyzedListings.length - listingsToAnalyze.length,
      jobIds,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in scheduled analysis:', error);

    return NextResponse.json(
      {
        error: 'Failed to queue scheduled analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
