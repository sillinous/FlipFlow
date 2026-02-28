import * as cheerio from 'cheerio'

export interface FlippaListing {
  id: string
  title: string
  url: string
  asking_price: number
  monthly_revenue: number
  monthly_profit: number
  annual_revenue: number
  business_type: string
  age_months: number
  niche: string
  description: string
  highlights: string[]
  traffic_data?: string
  monetization?: string[]
  reason_for_selling?: string
  asking_multiple?: number
}

const FLIPPA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

// Extract listing ID from Flippa URL
export function extractListingId(url: string): string | null {
  const patterns = [
    /flippa\.com\/listings\/(\d+)/,
    /flippa\.com\/(\d+)/,
    /flippa\.com\/[^/]+\/(\d+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Parse currency string to number
function parseCurrency(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/[$,\s]/g, '').replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

// Parse age string to months
function parseAge(str: string): number {
  if (!str) return 0
  const years = str.match(/(\d+)\s*year/)
  const months = str.match(/(\d+)\s*month/)
  return (parseInt(years?.[1] || '0') * 12) + parseInt(months?.[1] || '0')
}

export async function fetchFlippaListing(url: string): Promise<FlippaListing> {
  const listingId = extractListingId(url)
  if (!listingId) throw new Error('Invalid Flippa URL — could not extract listing ID')

  // Try public API first
  const apiUrl = `https://flippa.com/api/v1/listing/${listingId}`
  
  try {
    const apiRes = await fetch(apiUrl, { headers: FLIPPA_HEADERS, cache: 'no-store' })
    if (apiRes.ok) {
      const data = await apiRes.json()
      return parseApiResponse(data, url, listingId)
    }
  } catch {
    // Fall through to HTML scraping
  }

  // Fallback: scrape HTML
  const htmlRes = await fetch(url, { 
    headers: FLIPPA_HEADERS, 
    cache: 'no-store',
    signal: AbortSignal.timeout(15000)
  })
  
  if (!htmlRes.ok) {
    throw new Error(`Failed to fetch listing: ${htmlRes.status} ${htmlRes.statusText}`)
  }

  const html = await htmlRes.text()
  return scrapeHtml(html, url, listingId)
}

function parseApiResponse(data: Record<string, unknown>, url: string, id: string): FlippaListing {
  const listing = (data.listing || data) as Record<string, unknown>
  return {
    id,
    url,
    title: String(listing.title || listing.name || ''),
    asking_price: parseCurrency(String(listing.price || listing.asking_price || 0)),
    monthly_revenue: parseCurrency(String(listing.monthly_revenue || 0)),
    monthly_profit: parseCurrency(String(listing.monthly_profit || listing.net_profit || 0)),
    business_type: String(listing.listing_type || listing.business_type || 'Website'),
    age_months: parseAge(String(listing.age || '')),
    niche: String(listing.category || listing.niche || ''),
    description: String(listing.description || listing.summary || ''),
    highlights: Array.isArray(listing.highlights) ? listing.highlights.map(String) : [],
    annual_revenue: parseCurrency(String(listing.annual_revenue || 0)) || parseCurrency(String(listing.monthly_revenue || 0)) * 12,
    monetization: Array.isArray(listing.monetization) ? listing.monetization.map(String) : [String(listing.monetization || '')].filter(Boolean),
    reason_for_selling: String(listing.reason_for_selling || ''),
  }
}

function scrapeHtml(html: string, url: string, id: string): FlippaListing {
  const $ = cheerio.load(html)
  
  // Extract JSON-LD structured data
  let jsonLd: Record<string, unknown> = {}
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '{}')
      if (parsed['@type'] === 'Product' || parsed.name) {
        jsonLd = parsed
      }
    } catch {}
  })

  // Extract __NEXT_DATA__ if available
  let nextData: Record<string, unknown> = {}
  try {
    const nextScript = $('#__NEXT_DATA__').html()
    if (nextScript) {
      const parsed = JSON.parse(nextScript)
      nextData = parsed?.props?.pageProps?.listing || {}
    }
  } catch {}

  const title = 
    $(nextData as never).attr?.('title') ||
    String(nextData.title || '') ||
    $('h1').first().text().trim() ||
    $('[class*="title"]').first().text().trim() ||
    String(jsonLd.name || '')

  // Price extraction — try multiple selectors
  const priceText = 
    $('[data-testid="asking-price"]').text() ||
    $('[class*="asking-price"]').text() ||
    $('[class*="AskingPrice"]').text() ||
    String(nextData.asking_price || nextData.price || '')

  const revenueText =
    $('[data-testid="monthly-revenue"]').text() ||
    $('[class*="monthly-revenue"]').text() ||
    String(nextData.monthly_revenue || '')

  const profitText =
    $('[data-testid="monthly-profit"]').text() ||
    $('[class*="monthly-profit"]').text() ||
    String(nextData.monthly_profit || '')

  const description = 
    String(nextData.description || '') ||
    $('[class*="description"]').first().text().trim().slice(0, 2000) ||
    $('article').text().trim().slice(0, 2000)

  const highlights: string[] = []
  $('[class*="highlight"], [class*="Highlight"], [data-testid*="highlight"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length > 10) highlights.push(text)
  })

  return {
    id,
    url,
    title: title || `Flippa Listing #${id}`,
    asking_price: parseCurrency(priceText),
    monthly_revenue: parseCurrency(revenueText),
    monthly_profit: parseCurrency(profitText),
    business_type: String(nextData.listing_type || nextData.business_type || 'Website'),
    age_months: parseAge(String(nextData.age || '')),
    niche: String(nextData.category || nextData.niche || ''),
    description,
    highlights: highlights.slice(0, 10),
    annual_revenue: parseCurrency(String(nextData.annual_revenue || '')) || parseCurrency(revenueText) * 12,
    monetization: Array.isArray(nextData.monetization) ? nextData.monetization.map(String) : [String(nextData.monetization || '')].filter(Boolean),
    reason_for_selling: String(nextData.reason_for_selling || ''),
  }
}

// Fetch multiple listings for Scout
export async function fetchFlippaSearch(params: {
  min_price?: number
  max_price?: number
  listing_type?: string
  page?: number
  per_page?: number
}): Promise<{ listings: FlippaListing[]; total: number }> {
  const searchUrl = new URL('https://flippa.com/search')
  if (params.min_price) searchUrl.searchParams.set('filter[price_min]', String(params.min_price))
  if (params.max_price) searchUrl.searchParams.set('filter[price_max]', String(params.max_price))
  if (params.listing_type) searchUrl.searchParams.set('filter[listing_type][]', params.listing_type)
  searchUrl.searchParams.set('filter[status]', 'open')
  searchUrl.searchParams.set('sort', '-score')
  searchUrl.searchParams.set('page[number]', String(params.page || 1))
  searchUrl.searchParams.set('page[size]', String(params.per_page || 20))

  try {
    const res = await fetch(searchUrl.toString(), {
      headers: { ...FLIPPA_HEADERS, 'Accept': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    
    const listings = (data.data || data.listings || []).map((item: Record<string, unknown>) => {
      const attrs = (item.attributes || {}) as Record<string, unknown>
      return {
      id: String(item.id || ''),
      url: `https://flippa.com/listings/${item.id}`,
      title: String(attrs.title || item.title || ''),
      asking_price: parseCurrency(String(attrs.asking_price || item.price || 0)),
      monthly_revenue: parseCurrency(String(attrs.monthly_revenue || 0)),
      monthly_profit: parseCurrency(String(attrs.monthly_profit || 0)),
      business_type: String(attrs.listing_type || 'Website'),
      age_months: parseAge(String(attrs.age || '')),
      niche: String(attrs.category || ''),
      description: String(attrs.summary || '').slice(0, 500),
      highlights: [],
      annual_revenue: parseCurrency(String(attrs.annual_revenue || 0)) || parseCurrency(String(attrs.monthly_revenue || 0)) * 12,
      monetization: [],
    } as FlippaListing
    })

    return { listings, total: data.meta?.total || listings.length }
  } catch {
    return { listings: [], total: 0 }
  }
}
