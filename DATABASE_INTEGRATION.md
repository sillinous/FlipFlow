# FlipFlow Database Integration Documentation

This document describes the Supabase database integration implemented for FlipFlow.

## Overview

The database integration provides persistent storage for:
- User accounts and subscription management
- Flippa listing data (scraped/analyzed)
- AI analysis results
- User alert subscriptions

## Files Created

### Core Database Files

#### `/lib/types.ts`
TypeScript type definitions matching the database schema:
- `User`, `UserInsert`, `UserUpdate` - User account types
- `Listing`, `ListingInsert`, `ListingUpdate` - Listing data types
- `Analysis`, `AnalysisInsert`, `AnalysisUpdate` - Analysis result types
- `Alert`, `AlertInsert`, `AlertUpdate` - Alert subscription types
- Extended types: `ListingWithAnalysis`, `ListingFilters`, `AnalysisData`

#### `/lib/supabase.ts`
Supabase client initialization and authentication helpers:
- `supabase` - Legacy client-side Supabase client
- `createSupabaseBrowserClient()` - Browser client with SSR support
- `createSupabaseServerClient()` - Server client for API routes
- `getServiceSupabase()` - Admin client with service role key
- `getCurrentUser()` - Get current authenticated user
- `requireAuth()` - Require authentication (throws if not authenticated)

#### `/lib/db.ts`
Database query functions organized by entity:

**User Operations:**
- `getOrCreateUser(email, name)` - Get or create user by email
- `getUserById(userId)` - Get user by ID
- `updateUserCredits(userId, credits)` - Update user's analysis credits
- `decrementUserCredits(userId)` - Decrement credits (for usage tracking)
- `hasAnalysisCredits(userId)` - Check if user has available credits
- `getRemainingCredits(userId)` - Get user's remaining credits

**Listing Operations:**
- `saveListing(listingData)` - Save or update a scraped listing
- `getListingByUrl(url)` - Get listing by URL
- `getListingByFlippaId(flippaId)` - Get listing by Flippa ID
- `getListings(filters)` - Query listings with filters

**Analysis Operations:**
- `saveAnalysis(userId, listingUrl, analysisData)` - Save AI analysis results
- `getAnalyses(userId)` - Get user's analysis history
- `getAnalysisById(analysisId)` - Get analysis by ID
- `getLatestAnalysisForListing(listingId)` - Get latest analysis for a listing

**Alert Operations:**
- `createAlert(userId, alertData)` - Create a new alert subscription
- `getAlerts(userId)` - Get user's active alerts
- `updateAlert(alertId, updates)` - Update alert
- `deleteAlert(alertId)` - Delete (deactivate) alert
- `getAllActiveAlerts()` - Get all active alerts (for system use)

### API Routes

#### `/app/api/analyze/route.ts`
**Updated** to integrate with database:
- Checks user authentication
- Validates analysis credits
- Saves analysis results to database
- Returns remaining credits in response
- Uses subscription system for credit management

**POST /api/analyze**
```json
{
  "url": "https://flippa.com/...",
  "listingData": "Listing details..."
}
```

Response:
```json
{
  "success": true,
  "analysis": { ... },
  "timestamp": "2024-01-05T...",
  "credits": {
    "remaining": 2,
    "unlimited": false
  }
}
```

#### `/app/api/analyses/route.ts`
Fetch user's analysis history.

**GET /api/analyses**
- Returns all analyses for authenticated user
- Requires authentication

**GET /api/analyses?id={analysisId}**
- Returns single analysis by ID
- Requires authentication

Response:
```json
{
  "success": true,
  "analyses": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "score": 75,
      "deal_quality": "good",
      "recommendation": "...",
      "summary": "...",
      "created_at": "2024-01-05T..."
    }
  ],
  "count": 10
}
```

#### `/app/api/listings/route.ts`
Query listings with filters.

**GET /api/listings**
Query parameters:
- `url` - Fetch specific listing by URL
- `min_score` - Minimum analysis score (0-100)
- `max_price` - Maximum asking price
- `category` - Listing category
- `deal_quality` - excellent|good|fair|poor|avoid
- `limit` - Results per page (default 50, max 100)
- `offset` - Pagination offset (default 0)

Response:
```json
{
  "success": true,
  "listings": [
    {
      "id": "uuid",
      "flippa_id": "abc123",
      "url": "https://...",
      "title": "...",
      "asking_price": 10000,
      "monthly_revenue": 500,
      "analysis": { ... }
    }
  ],
  "count": 25,
  "filters": { ... }
}
```

#### `/app/api/alerts/route.ts`
Manage user alert subscriptions.

**GET /api/alerts**
- Returns user's active alerts
- Requires authentication

**POST /api/alerts**
Create new alert:
```json
{
  "name": "High Value Deals",
  "min_score": 80,
  "max_price": 50000
}
```

**PATCH /api/alerts**
Update existing alert:
```json
{
  "id": "uuid",
  "min_score": 85,
  "is_active": true
}
```

**DELETE /api/alerts?id={alertId}**
- Deactivates alert
- Requires authentication

## Database Schema

See `/supabase/schema.sql` for the complete schema definition.

**Tables:**
- `users` - User accounts and subscription info
- `listings` - Scraped Flippa listings
- `analyses` - AI analysis results
- `alerts` - User alert subscriptions

## Usage Examples

### Saving an Analysis

```typescript
import { saveAnalysis } from '@/lib/db';

const analysisData = {
  score: 85,
  dealQuality: 'excellent',
  recommendation: {
    action: 'strong_buy',
    reasoning: '...',
    targetPrice: 45000
  },
  summary: '...',
  valuation: { ... },
  risks: [ ... ],
  opportunities: [ ... ],
  financials: { ... },
  keyInsights: [ ... ]
};

const analysis = await saveAnalysis(
  userId,
  'https://flippa.com/listing/123',
  analysisData
);
```

### Querying Listings

```typescript
import { getListings } from '@/lib/db';

const listings = await getListings({
  min_score: 70,
  max_price: 100000,
  deal_quality: 'excellent',
  limit: 20,
  offset: 0
});
```

### Creating an Alert

```typescript
import { createAlert } from '@/lib/db';

const alert = await createAlert(userId, {
  name: 'Premium SaaS Deals',
  min_score: 85,
  max_price: 50000
});
```

### Checking User Credits

```typescript
import { hasAnalysisCredits, getRemainingCredits } from '@/lib/db';

const hasCredits = await hasAnalysisCredits(userId);
const remaining = await getRemainingCredits(userId);

console.log(`User has ${remaining} credits remaining`);
```

## Authentication Flow

1. User authenticates via Supabase Auth
2. `getCurrentUser()` retrieves user session
3. `getOrCreateUser()` ensures user exists in database
4. API routes use `requireAuth()` to enforce authentication
5. User operations are scoped to authenticated user ID

## Credit System

- Free tier: 3 analyses
- Paid tiers: Configurable credits or unlimited (-1)
- Credits are tracked via `analysis_credits` field
- Usage is decremented on each analysis
- Unlimited plans (credits = -1) bypass credit checks

## Error Handling

All database functions throw errors that should be caught:

```typescript
try {
  const analysis = await saveAnalysis(userId, url, data);
} catch (error) {
  console.error('Failed to save analysis:', error);
  // Handle error appropriately
}
```

API routes return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `402` - Payment Required (no credits)
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx  # Server-side only
```

## Integration with Subscription System

The database layer integrates with `/lib/subscription.ts` for:
- Credit management via `canPerformAnalysis()` and `consumeAnalysisCredit()`
- Subscription tier validation
- Usage tracking

Note: The subscription system uses a slightly different schema structure (plan_id, used_credits) compared to the base schema. Both systems are compatible.

## Testing

To test the database integration:

1. Set up Supabase credentials in `.env.local`
2. Run schema migration: `npm run db:migrate`
3. Test API endpoints:

```bash
# Analyze a listing (authenticated)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://flippa.com/...", "listingData":"..."}'

# Get analyses
curl http://localhost:3000/api/analyses

# Query listings
curl "http://localhost:3000/api/listings?min_score=70&max_price=100000"

# Create alert
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"name":"High Value Deals","min_score":80}'
```

## Future Enhancements

Potential improvements:
- Add pagination metadata to API responses
- Implement full-text search on listings
- Add analysis comparison features
- Create materialized views for performance
- Add webhook notifications for alerts
- Implement rate limiting with Redis
- Add analytics and reporting queries

## Support

For issues or questions about the database integration:
1. Check Supabase logs for database errors
2. Verify environment variables are set correctly
3. Review API route logs for debugging
4. Check RLS policies if permission errors occur
