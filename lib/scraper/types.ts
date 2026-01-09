/**
 * FlipFlow Scout Agent - Scraper Types
 * Type definitions for Flippa listing scraping
 */

export interface FlippaListing {
  // Core identifiers
  id: string;
  url: string;
  flippaId: string;

  // Basic info
  title: string;
  description: string;
  category: string;
  subcategory?: string;

  // Pricing
  askingPrice: number;
  currency: string;
  priceType: 'fixed' | 'auction' | 'make_offer';

  // Financial metrics
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  annualRevenue: number | null;
  annualProfit: number | null;
  profitMargin: number | null;

  // Traffic metrics
  monthlyVisitors: number | null;
  monthlyPageviews: number | null;
  trafficSources?: Record<string, number>;

  // Business details
  ageMonths: number | null;
  monetizationMethods?: string[];
  platformType?: string;
  technologies?: string[];

  // Additional metrics
  socialFollowers?: {
    instagram?: number;
    twitter?: number;
    facebook?: number;
    tiktok?: number;
    youtube?: number;
  };
  emailSubscribers?: number;
  domainAuthority?: number;
  backlinks?: number;

  // Listing metadata
  listingDate: Date;
  endDate?: Date;
  auctionEndDate?: Date;
  viewCount?: number;
  watcherCount?: number;
  bidCount?: number;
  currentBid?: number;

  // Seller info
  sellerId?: string;
  sellerName?: string;
  sellerRating?: number;
  sellerVerified?: boolean;

  // Status
  status: 'active' | 'sold' | 'expired' | 'pending' | 'draft';
  featured?: boolean;
  verified?: boolean;

  // Raw data for analysis
  rawHtml?: string;
  screenshots?: string[];

  // Scraping metadata
  scrapedAt: Date;
  lastUpdated: Date;
  scrapeSource: string;
}

export interface ScrapeOptions {
  // Filters
  minPrice?: number;
  maxPrice?: number;
  minRevenue?: number;
  maxRevenue?: number;
  categories?: string[];
  subcategories?: string[];
  monetizationTypes?: string[];

  // Scraping behavior
  maxPages?: number;
  itemsPerPage?: number;
  startPage?: number;
  delay?: number; // milliseconds between requests
  timeout?: number; // milliseconds for page load

  // Content options
  includeDescription?: boolean;
  includeScreenshots?: boolean;
  includeRawHtml?: boolean;

  // Filtering
  onlyActive?: boolean;
  onlyVerified?: boolean;
  onlyFeatured?: boolean;
  excludeAuctions?: boolean;

  // Proxy settings
  useProxy?: boolean;
  proxyUrl?: string;

  // Advanced
  userAgent?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;

  // Retry logic
  maxRetries?: number;
  retryDelay?: number;
}

export interface ScrapeResult {
  success: boolean;
  listings: FlippaListing[];
  metadata: {
    totalFound: number;
    totalScraped: number;
    pagesScraped: number;
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
    errors: ScrapeError[];
  };
  filters?: ScrapeOptions;
}

export interface ScrapeError {
  timestamp: Date;
  type: 'network' | 'parsing' | 'timeout' | 'rate_limit' | 'unknown';
  message: string;
  url?: string;
  details?: any;
  retryAttempt?: number;
}

export interface ParsedFinancials {
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  annualRevenue: number | null;
  annualProfit: number | null;
  profitMargin: number | null;
  revenueGrowth?: number | null;
  profitGrowth?: number | null;
}

export interface ParsedTraffic {
  monthlyVisitors: number | null;
  monthlyPageviews: number | null;
  sources: Record<string, number>;
  topCountries?: string[];
  bounceRate?: number | null;
  avgSessionDuration?: number | null;
}

export interface ScraperStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalListingsScraped: number;
  totalErrors: number;
  averageDuration: number;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize: number;
  cooldownMs: number;
}

export interface ProxyConfig {
  enabled: boolean;
  url?: string;
  username?: string;
  password?: string;
  rotationEnabled?: boolean;
  healthCheckInterval?: number;
}

export interface ScraperConfig {
  // Core settings
  baseUrl: string;
  defaultDelay: number;
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;

  // Rate limiting
  rateLimit: RateLimitConfig;

  // Proxy
  proxy?: ProxyConfig;

  // Browser options
  headless: boolean;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };

  // Behavior
  respectRobotsTxt: boolean;
  randomizeDelay: boolean;
  captchaSolver?: 'manual' | 'service' | 'none';

  // Storage
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  saveScreenshots: boolean;
  saveRawHtml: boolean;
}

// Default configuration
export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  baseUrl: 'https://flippa.com',
  defaultDelay: 2000, // 2 seconds between requests
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds

  rateLimit: {
    requestsPerSecond: 0.5, // 1 request per 2 seconds
    requestsPerMinute: 20,
    requestsPerHour: 500,
    burstSize: 3,
    cooldownMs: 60000, // 1 minute cooldown if rate limited
  },

  headless: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: {
    width: 1920,
    height: 1080,
  },

  respectRobotsTxt: true,
  randomizeDelay: true,
  captchaSolver: 'none',

  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
  saveScreenshots: false,
  saveRawHtml: false,
};

// Selector mappings for Flippa website
export const FLIPPA_SELECTORS = {
  // Listing page
  listingCard: '.listing-card, [data-testid="listing-card"]',
  listingLink: 'a[href*="/listings/"]',
  listingTitle: '.listing-title, h2, h3',
  listingPrice: '.price, .asking-price, [data-testid="price"]',
  listingRevenue: '.revenue, [data-testid="revenue"]',
  listingProfit: '.profit, [data-testid="profit"]',
  listingCategory: '.category, [data-testid="category"]',

  // Detail page
  detailTitle: 'h1',
  detailDescription: '.description, [data-testid="description"]',
  detailPrice: '.price-value, [data-testid="asking-price"]',
  detailRevenue: '[data-label="Monthly Revenue"], .monthly-revenue',
  detailProfit: '[data-label="Monthly Profit"], .monthly-profit',
  detailTraffic: '[data-label="Monthly Visitors"], .monthly-visitors',
  detailAge: '[data-label="Age"], .business-age',

  // Financial metrics
  financialSection: '.financials, [data-testid="financials"]',
  revenueChart: '.revenue-chart',
  profitChart: '.profit-chart',

  // Traffic metrics
  trafficSection: '.traffic, [data-testid="traffic"]',
  trafficChart: '.traffic-chart',
  trafficSources: '.traffic-sources',

  // Pagination
  pagination: '.pagination',
  nextPage: '.pagination .next, [aria-label="Next page"]',
  prevPage: '.pagination .prev, [aria-label="Previous page"]',
  pageNumber: '.pagination .page-number',

  // Filters
  filterCategory: 'select[name="category"], #category-filter',
  filterPrice: 'input[name="price"], #price-filter',
  filterRevenue: 'input[name="revenue"], #revenue-filter',

  // Status indicators
  soldBadge: '.sold, [data-status="sold"]',
  featuredBadge: '.featured, [data-featured="true"]',
  verifiedBadge: '.verified, [data-verified="true"]',
  auctionBadge: '.auction, [data-type="auction"]',
};

// URL patterns
export const FLIPPA_URLS = {
  marketplace: '/search',
  listing: '/listings',
  api: '/api/v1',
  search: '/search',
  categories: {
    websites: '/search?filter[property_type]=website',
    apps: '/search?filter[property_type]=app',
    domains: '/search?filter[property_type]=domain',
    ecommerce: '/search?filter[property_type]=ecommerce',
    saas: '/search?filter[property_type]=saas',
  },
};

// Helper type guards
export function isValidListing(listing: any): listing is FlippaListing {
  return (
    typeof listing === 'object' &&
    listing !== null &&
    typeof listing.id === 'string' &&
    typeof listing.url === 'string' &&
    typeof listing.title === 'string' &&
    typeof listing.askingPrice === 'number' &&
    typeof listing.status === 'string'
  );
}

export function isSuccessfulScrape(result: ScrapeResult): boolean {
  return result.success && result.listings.length > 0;
}

// Error types
export class ScrapeTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScrapeTimeoutError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ParseError extends Error {
  constructor(message: string, public html?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}
