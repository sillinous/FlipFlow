/**
 * FlipFlow Scout Agent - Scrape API Route
 * API endpoint to trigger scraping jobs
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueInstance } from '@/lib/queue';
import type { ScrapeJobData } from '@/lib/queue';
import type { ScrapeOptions } from '@/lib/scraper/types';

// Environment variables
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

/**
 * Verify admin authentication
 */
function verifyAuth(request: NextRequest): { authorized: boolean; error?: string } {
  // Check API key in header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey === ADMIN_API_KEY) {
    return { authorized: true };
  }

  // Check webhook secret (for n8n)
  const webhookSecret = request.headers.get('x-webhook-secret');
  if (N8N_WEBHOOK_SECRET && webhookSecret === N8N_WEBHOOK_SECRET) {
    return { authorized: true };
  }

  // Check bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === ADMIN_API_KEY) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    error: 'Unauthorized - Invalid or missing API key',
  };
}

/**
 * POST /api/scrape
 * Queue a new scrape job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    const {
      options = {},
      priority = 0,
      source = 'api',
      userId,
      notifyOnComplete = false,
    } = body;

    // Validate options
    const scrapeOptions: ScrapeOptions = {
      maxPages: options.maxPages || 5,
      itemsPerPage: options.itemsPerPage || 20,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      minRevenue: options.minRevenue,
      maxRevenue: options.maxRevenue,
      categories: options.categories,
      onlyActive: options.onlyActive ?? true,
      onlyVerified: options.onlyVerified,
      onlyFeatured: options.onlyFeatured,
      excludeAuctions: options.excludeAuctions,
      includeDescription: options.includeDescription ?? true,
      includeScreenshots: options.includeScreenshots ?? false,
      includeRawHtml: options.includeRawHtml ?? false,
    };

    // Add job to queue
    const queue = getQueueInstance();
    const job = queue.add<ScrapeJobData>(
      'scrape',
      {
        options: scrapeOptions,
        source,
        userId,
        notifyOnComplete,
      },
      {
        priority,
        metadata: {
          requestedBy: userId || 'anonymous',
          requestedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`Scrape job queued: ${job.id}`);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: 'Scrape job queued successfully',
      estimatedDuration: '2-5 minutes',
    });
  } catch (error) {
    console.error('Error queueing scrape job:', error);

    return NextResponse.json(
      {
        error: 'Failed to queue scrape job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape?jobId=xxx
 * Get status of a scrape job
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      // Return queue stats if no jobId
      const queue = getQueueInstance();
      const stats = queue.getStats();

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Get specific job
    const queue = getQueueInstance();
    const job = queue.get(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job details
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        error: job.error,
        result: job.result,
      },
    });
  } catch (error) {
    console.error('Error getting scrape job:', error);

    return NextResponse.json(
      {
        error: 'Failed to get scrape job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scrape?jobId=xxx
 * Cancel a scrape job
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Cancel job
    const queue = getQueueInstance();
    const cancelled = queue.cancel(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Failed to cancel job - job may be in progress or not found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error) {
    console.error('Error cancelling scrape job:', error);

    return NextResponse.json(
      {
        error: 'Failed to cancel scrape job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/scrape
 * CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Webhook-Secret',
    },
  });
}
