import { NextRequest, NextResponse } from 'next/server';
import { getListings, getListingByUrl } from '@/lib/db';
import type { ListingFilters } from '@/lib/types';

export const runtime = 'edge';

/**
 * GET /api/listings
 * Query listings with optional filters
 *
 * Query Parameters:
 * - url: string (fetch specific listing by URL)
 * - min_score: number (minimum analysis score)
 * - max_price: number (maximum asking price)
 * - category: string (listing category)
 * - deal_quality: string (excellent|good|fair|poor|avoid)
 * - limit: number (results per page, default 50)
 * - offset: number (pagination offset, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if fetching a specific listing by URL
    const url = searchParams.get('url');
    if (url) {
      const listing = await getListingByUrl(url);

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        listing,
      });
    }

    // Build filters from query parameters
    const filters: ListingFilters = {};

    const minScore = searchParams.get('min_score');
    if (minScore) {
      const score = parseInt(minScore, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        filters.min_score = score;
      }
    }

    const maxPrice = searchParams.get('max_price');
    if (maxPrice) {
      const price = parseFloat(maxPrice);
      if (!isNaN(price) && price > 0) {
        filters.max_price = price;
      }
    }

    const category = searchParams.get('category');
    if (category) {
      filters.category = category;
    }

    const dealQuality = searchParams.get('deal_quality');
    if (dealQuality) {
      filters.deal_quality = dealQuality;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        filters.limit = limitNum;
      }
    }

    const offset = searchParams.get('offset');
    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        filters.offset = offsetNum;
      }
    }

    // Fetch listings
    const listings = await getListings(filters);

    return NextResponse.json({
      success: true,
      listings,
      count: listings.length,
      filters: filters,
    });

  } catch (error) {
    console.error('Error fetching listings:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch listings',
      },
      { status: 500 }
    );
  }
}
