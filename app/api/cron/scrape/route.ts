/**
 * FlipFlow - Scheduled Scrape Cron Endpoint
 *
 * This endpoint is designed to be called by Vercel Cron or external schedulers.
 * It triggers an automated scrape of Flippa listings.
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/scrape",
 *     "schedule": "0 */6 * * *"  // Every 6 hours
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueInstance } from '@/lib/queue';
import type { ScrapeJobData } from '@/lib/queue';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronAuth(request: NextRequest): boolean {
  // Check for Vercel cron header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  // Check for x-cron-secret header (alternative)
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret === CRON_SECRET) {
    return true;
  }

  // In development, allow without secret
  if (process.env.NODE_ENV === 'development' && !CRON_SECRET) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      console.warn('Unauthorized cron request attempted');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled scrape job...');

    // Queue scrape job with default settings for automated discovery
    const queue = getQueueInstance();

    const scrapeJob = queue.add<ScrapeJobData>(
      'scrape',
      {
        options: {
          maxPages: 3,           // Scrape 3 pages per run
          itemsPerPage: 20,      // ~60 listings per run
          onlyActive: true,      // Only active listings
          onlyVerified: false,   // Include unverified
          excludeAuctions: false,
          includeDescription: true,
          includeScreenshots: false,
          includeRawHtml: false,
        },
        source: 'scheduled',
        notifyOnComplete: false,
      },
      {
        priority: 5,  // Higher priority for scheduled jobs
        metadata: {
          triggeredBy: 'cron',
          triggeredAt: new Date().toISOString(),
        },
      }
    );

    console.log(`Scheduled scrape job queued: ${scrapeJob.id}`);

    return NextResponse.json({
      success: true,
      message: 'Scheduled scrape job queued',
      jobId: scrapeJob.id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in scheduled scrape:', error);

    return NextResponse.json(
      {
        error: 'Failed to queue scheduled scrape',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
