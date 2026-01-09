/**
 * FlipFlow - Webhook Endpoint
 *
 * Receives events from external services (n8n, Zapier, custom integrations)
 * to trigger scrapes, analyses, or other actions.
 *
 * Supported Actions:
 * - scrape: Trigger a scrape job
 * - analyze: Analyze a specific listing URL
 * - analyze_batch: Analyze multiple listings
 * - alert: Send an alert notification
 *
 * Security: Protected by WEBHOOK_SECRET or N8N_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueInstance } from '@/lib/queue';
import { analyzeFlippaListing } from '@/lib/analyzer';
import { saveAnalysis, saveListing, getListingByUrl } from '@/lib/db';
import type { ScrapeJobData, AnalyzeJobData, AlertJobData } from '@/lib/queue';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET;

interface WebhookPayload {
  action: 'scrape' | 'analyze' | 'analyze_batch' | 'alert' | 'ping';
  data?: any;
  metadata?: Record<string, any>;
}

function verifyWebhookAuth(request: NextRequest): { valid: boolean; source?: string } {
  // Check x-webhook-secret header
  const webhookSecret = request.headers.get('x-webhook-secret');
  if (webhookSecret && webhookSecret === WEBHOOK_SECRET) {
    return { valid: true, source: 'webhook-secret' };
  }

  // Check Authorization bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === WEBHOOK_SECRET) {
      return { valid: true, source: 'bearer-token' };
    }
  }

  // Check n8n specific header
  const n8nSecret = request.headers.get('x-n8n-secret');
  if (n8nSecret && n8nSecret === WEBHOOK_SECRET) {
    return { valid: true, source: 'n8n' };
  }

  // Allow in development without secret
  if (process.env.NODE_ENV === 'development' && !WEBHOOK_SECRET) {
    return { valid: true, source: 'development' };
  }

  return { valid: false };
}

async function handleScrape(data: any): Promise<any> {
  const queue = getQueueInstance();

  const scrapeJob = queue.add<ScrapeJobData>('scrape', {
    options: {
      maxPages: data?.maxPages || 3,
      minPrice: data?.minPrice,
      maxPrice: data?.maxPrice,
      categories: data?.categories,
      onlyActive: data?.onlyActive ?? true,
      includeDescription: true,
    },
    source: 'webhook',
    userId: data?.userId,
    notifyOnComplete: data?.notifyOnComplete ?? false,
  }, {
    priority: data?.priority || 3,
    metadata: {
      triggeredBy: 'webhook',
      webhookData: data,
    },
  });

  return {
    action: 'scrape',
    jobId: scrapeJob.id,
    status: 'queued',
  };
}

async function handleAnalyze(data: any): Promise<any> {
  if (!data?.url) {
    throw new Error('URL is required for analyze action');
  }

  const url = data.url;

  // Check if we already have this listing
  let listing = await getListingByUrl(url);

  // If not, create a basic listing record
  if (!listing) {
    const flippaIdMatch = url.match(/flippa\.com\/.*?([a-zA-Z0-9-]+)$/);
    const flippaId = flippaIdMatch ? flippaIdMatch[1] : url;

    listing = await saveListing({
      flippa_id: flippaId,
      url: url,
      title: data.title || 'Webhook Listing',
      asking_price: data.askingPrice || null,
      monthly_revenue: data.monthlyRevenue || null,
      monthly_profit: data.monthlyProfit || null,
    });
  }

  // If synchronous analysis requested, run immediately
  if (data?.sync === true) {
    const listingDataStr = JSON.stringify({
      title: data.title || listing.title,
      url: url,
      askingPrice: data.askingPrice || listing.asking_price,
      monthlyRevenue: data.monthlyRevenue || listing.monthly_revenue,
      monthlyProfit: data.monthlyProfit || listing.monthly_profit,
      category: data.category,
      description: data.description?.substring(0, 2000),
    });

    const analysis = await analyzeFlippaListing(listingDataStr, url);

    // Save analysis
    await saveAnalysis('webhook', url, {
      score: analysis.score,
      dealQuality: analysis.dealQuality,
      recommendation: analysis.recommendation,
      summary: analysis.summary,
      valuation: analysis.valuation,
      financials: analysis.financials,
    });

    return {
      action: 'analyze',
      listingId: listing.id,
      analysis: {
        score: analysis.score,
        dealQuality: analysis.dealQuality,
        recommendation: analysis.recommendation.action,
        summary: analysis.summary,
      },
    };
  }

  // Otherwise, queue the analysis
  const queue = getQueueInstance();
  const listingDataStr = JSON.stringify({
    title: data.title || listing.title,
    url: url,
    askingPrice: data.askingPrice || listing.asking_price,
    monthlyRevenue: data.monthlyRevenue || listing.monthly_revenue,
    monthlyProfit: data.monthlyProfit || listing.monthly_profit,
    category: data.category,
    description: data.description?.substring(0, 2000),
  });

  const job = queue.add<AnalyzeJobData>('analyze', {
    listingId: listing.id,
    listingUrl: url,
    listingData: listingDataStr,
    notifyOnComplete: data?.notifyOnComplete ?? false,
  });

  return {
    action: 'analyze',
    listingId: listing.id,
    jobId: job.id,
    status: 'queued',
  };
}

async function handleAnalyzeBatch(data: any): Promise<any> {
  if (!data?.urls || !Array.isArray(data.urls)) {
    throw new Error('urls array is required for analyze_batch action');
  }

  const queue = getQueueInstance();
  const results: any[] = [];

  for (const url of data.urls.slice(0, 20)) { // Limit to 20
    try {
      // Check/create listing
      let listing = await getListingByUrl(url);

      if (!listing) {
        const flippaIdMatch = url.match(/flippa\.com\/.*?([a-zA-Z0-9-]+)$/);
        const flippaId = flippaIdMatch ? flippaIdMatch[1] : url;

        listing = await saveListing({
          flippa_id: flippaId,
          url: url,
          title: 'Webhook Batch Listing',
        });
      }

      const job = queue.add<AnalyzeJobData>('analyze', {
        listingId: listing.id,
        listingUrl: url,
        listingData: JSON.stringify({ url }),
      });

      results.push({
        url,
        listingId: listing.id,
        jobId: job.id,
        status: 'queued',
      });
    } catch (error) {
      results.push({
        url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    action: 'analyze_batch',
    total: results.length,
    queued: results.filter(r => r.status === 'queued').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };
}

async function handleAlert(data: any): Promise<any> {
  if (!data?.userId || !data?.listings) {
    throw new Error('userId and listings are required for alert action');
  }

  const queue = getQueueInstance();

  const alertJob = queue.add<AlertJobData>('alert', {
    userId: data.userId,
    alertId: data.alertId || 'webhook-alert',
    listings: data.listings,
    minScore: data.minScore,
  });

  return {
    action: 'alert',
    jobId: alertJob.id,
    status: 'queued',
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const auth = verifyWebhookAuth(request);
    if (!auth.valid) {
      console.warn('Unauthorized webhook request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: WebhookPayload = await request.json();

    if (!payload.action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    console.log(`Webhook received: ${payload.action} from ${auth.source}`);

    let result: any;

    switch (payload.action) {
      case 'ping':
        result = {
          action: 'ping',
          status: 'ok',
          timestamp: new Date().toISOString(),
        };
        break;

      case 'scrape':
        result = await handleScrape(payload.data);
        break;

      case 'analyze':
        result = await handleAnalyze(payload.data);
        break;

      case 'analyze_batch':
        result = await handleAnalyzeBatch(payload.data);
        break;

      case 'alert':
        result = await handleAlert(payload.data);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${payload.action}` },
          { status: 400 }
        );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET(request: NextRequest) {
  const auth = verifyWebhookAuth(request);

  return NextResponse.json({
    status: 'ok',
    authenticated: auth.valid,
    timestamp: new Date().toISOString(),
    actions: ['ping', 'scrape', 'analyze', 'analyze_batch', 'alert'],
  });
}
