/**
 * FlipFlow - Daily Digest Cron Endpoint
 *
 * Sends daily email digests to users with their alert matches
 * and top deals from the past 24 hours.
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/digest",
 *     "schedule": "0 9 * * *"  // Daily at 9 AM UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;

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

interface DigestListing {
  title: string;
  url: string;
  asking_price: number;
  score: number;
  deal_quality: string;
}

function generateDigestEmail(
  userName: string,
  listings: DigestListing[],
  stats: { totalAnalyzed: number; avgScore: number }
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flipflow.ai';

  const listingsHtml = listings.length > 0
    ? listings.map(l => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <a href="${appUrl}/analyze?url=${encodeURIComponent(l.url)}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
              ${l.title}
            </a>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; ${
              l.score >= 70 ? 'background: #dcfce7; color: #15803d;' :
              l.score >= 50 ? 'background: #dbeafe; color: #1d4ed8;' :
              'background: #fef3c7; color: #b45309;'
            }">
              ${l.score}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${l.asking_price.toLocaleString()}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="padding: 24px; text-align: center; color: #6b7280;">No new high-score deals in the last 24 hours</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; }
        </style>
      </head>
      <body style="background: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px;">Your Daily Deal Digest</h1>
            <p style="margin: 0; opacity: 0.9;">Top opportunities from the last 24 hours</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin-top: 0;">Hi ${userName},</p>

            <!-- Stats -->
            <div style="display: flex; gap: 20px; margin: 20px 0;">
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.totalAnalyzed}</div>
                <div style="font-size: 12px; color: #6b7280;">Deals Analyzed</div>
              </div>
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.avgScore}</div>
                <div style="font-size: 12px; color: #6b7280;">Avg Score</div>
              </div>
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${listings.length}</div>
                <div style="font-size: 12px; color: #6b7280;">Top Deals</div>
              </div>
            </div>

            <!-- Top Deals Table -->
            <h2 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px;">Top Deals (Score 60+)</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Listing</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Score</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${listingsHtml}
              </tbody>
            </table>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}/listings" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View All Deals
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Happy deal hunting!<br>
              The FlipFlow Team
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">
              You're receiving this because you're subscribed to FlipFlow digests.
              <a href="${appUrl}/dashboard/settings" style="color: #6b7280;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      console.warn('Unauthorized cron digest request attempted');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting daily digest job...');

    const client = getServiceSupabase();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get analyses from the last 24 hours
    const { data: recentAnalyses } = await client
      .from('analyses')
      .select(`
        score, deal_quality,
        listings(title, url, asking_price)
      `)
      .gte('created_at', twentyFourHoursAgo)
      .order('score', { ascending: false });

    const analyses = (recentAnalyses || []) as any[];

    // Calculate stats
    const totalAnalyzed = analyses.length;
    const avgScore = totalAnalyzed > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / totalAnalyzed)
      : 0;

    // Get top deals (score >= 60)
    const topDeals: DigestListing[] = analyses
      .filter(a => a.score >= 60 && a.listings)
      .slice(0, 10)
      .map(a => ({
        title: a.listings.title,
        url: a.listings.url,
        asking_price: a.listings.asking_price || 0,
        score: a.score,
        deal_quality: a.deal_quality,
      }));

    // Get users who should receive digest (active subscriptions)
    const { data: users } = await client
      .from('users')
      .select('id, email, name, subscription_tier')
      .neq('subscription_tier', 'free');

    const usersToEmail = (users || []) as any[];

    if (usersToEmail.length === 0) {
      console.log('No subscribers to send digest to');
      return NextResponse.json({
        success: true,
        message: 'No subscribers found',
        emailsSent: 0,
      });
    }

    // Send digests
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const user of usersToEmail) {
      try {
        const emailHtml = generateDigestEmail(
          user.name || user.email.split('@')[0],
          topDeals,
          { totalAnalyzed, avgScore }
        );

        const result = await sendEmail({
          to: user.email,
          subject: `FlipFlow Daily Digest: ${topDeals.length} Top Deals Found`,
          html: emailHtml,
        });

        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error(`Failed to send digest to ${user.email}: ${result.error}`);
        }
      } catch (error) {
        emailsFailed++;
        console.error(`Error sending digest to ${user.email}:`, error);
      }
    }

    console.log(`Daily digest complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Daily digest sent',
      stats: {
        totalAnalyzed,
        avgScore,
        topDeals: topDeals.length,
      },
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in daily digest:', error);

    return NextResponse.json(
      {
        error: 'Failed to send daily digest',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
