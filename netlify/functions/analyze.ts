import type { Handler, HandlerEvent } from '@netlify/functions'
import { fetchFlippaListing } from '../../lib/flippa'
import { analyzeListingWithAI } from '../../lib/ai'

function cors(body: object, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  }
  if (event.httpMethod !== 'POST') return cors({ error: 'Method not allowed' }, 405)

  try {
    const { url } = JSON.parse(event.body || '{}')
    if (!url?.includes('flippa.com')) return cors({ error: 'Please enter a valid Flippa listing URL' }, 400)

    const listing = await fetchFlippaListing(url)
    const analysis = await analyzeListingWithAI(listing)

    return cors({
      listing: {
        title: listing.title,
        url: listing.url,
        asking_price: listing.asking_price,
        monthly_profit: listing.monthly_profit,
        monthly_revenue: listing.monthly_revenue,
        annual_revenue: listing.annual_revenue || listing.monthly_revenue * 12,
        listing_type: analysis.listing_type,
        age_months: listing.age_months,
        monetization: listing.monetization || [],
        niche: analysis.niche,
        description: listing.description || '',
      },
      analysis: {
        flip_score: analysis.flip_score.overall,
        score_breakdown: {
          financials: analysis.flip_score.financials,
          traffic: analysis.flip_score.traffic,
          risk: analysis.flip_score.risk,
          growth: analysis.flip_score.growth,
          operations: analysis.flip_score.operations,
        },
        red_flags: analysis.red_flags,
        growth_opportunities: analysis.growth_opportunities,
        valuation: analysis.valuation,
        summary: analysis.summary,
        investment_thesis: analysis.investment_thesis,
        flip_plan: analysis.flip_plan || null,
        roi_scenarios: analysis.roi_scenarios || null,
        negotiation: analysis.negotiation || null,
      },
    })
  } catch (err) {
    console.error('Analysis error:', err)
    return cors({ error: err instanceof Error ? err.message : 'Analysis failed' }, 500)
  }
}
