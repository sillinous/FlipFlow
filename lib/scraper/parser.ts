/**
 * FlipFlow Scout Agent - HTML Parser
 * Utilities for parsing Flippa listing HTML and extracting structured data
 */

import type {
  FlippaListing,
  ParsedFinancials,
  ParsedTraffic,
  ParseError,
} from './types';
import { FLIPPA_SELECTORS } from './types';

/**
 * Parse a price string to number
 * Examples: "$1,234", "€1.234", "1234 USD" -> 1234
 */
export function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;

  try {
    // Remove currency symbols and common formatting
    const cleaned = priceStr
      .replace(/[$€£¥₹,\s]/g, '')
      .replace(/[A-Z]{3}/g, '') // Remove currency codes like USD, EUR
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : Math.round(parsed);
  } catch (error) {
    console.warn('Failed to parse price:', priceStr, error);
    return null;
  }
}

/**
 * Parse financial metrics with K/M/B suffixes
 * Examples: "1.5K" -> 1500, "2.3M" -> 2300000, "1B" -> 1000000000
 */
export function parseMetricWithSuffix(metricStr: string): number | null {
  if (!metricStr) return null;

  try {
    const cleaned = metricStr
      .replace(/[$€£¥₹,\s]/g, '')
      .toUpperCase()
      .trim();

    const multipliers: Record<string, number> = {
      K: 1000,
      M: 1000000,
      B: 1000000000,
    };

    for (const [suffix, multiplier] of Object.entries(multipliers)) {
      if (cleaned.includes(suffix)) {
        const number = parseFloat(cleaned.replace(suffix, ''));
        return isNaN(number) ? null : Math.round(number * multiplier);
      }
    }

    // No suffix, parse as-is
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : Math.round(parsed);
  } catch (error) {
    console.warn('Failed to parse metric:', metricStr, error);
    return null;
  }
}

/**
 * Parse age string to months
 * Examples: "2 years", "18 months", "1 year 6 months" -> months
 */
export function parseAge(ageStr: string): number | null {
  if (!ageStr) return null;

  try {
    let totalMonths = 0;

    // Match years
    const yearsMatch = ageStr.match(/(\d+\.?\d*)\s*y(?:ea)?r/i);
    if (yearsMatch) {
      totalMonths += parseFloat(yearsMatch[1]) * 12;
    }

    // Match months
    const monthsMatch = ageStr.match(/(\d+\.?\d*)\s*m(?:on)?th/i);
    if (monthsMatch) {
      totalMonths += parseFloat(monthsMatch[1]);
    }

    return totalMonths > 0 ? Math.round(totalMonths) : null;
  } catch (error) {
    console.warn('Failed to parse age:', ageStr, error);
    return null;
  }
}

/**
 * Parse percentage string to decimal
 * Examples: "25%", "12.5%" -> 0.25, 0.125
 */
export function parsePercentage(percentStr: string): number | null {
  if (!percentStr) return null;

  try {
    const cleaned = percentStr.replace(/[%\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed / 100;
  } catch (error) {
    console.warn('Failed to parse percentage:', percentStr, error);
    return null;
  }
}

/**
 * Parse date string to Date object
 * Handles various date formats
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
    return null;
  }
}

/**
 * Extract text content from an element
 */
export function extractText(element: any): string {
  if (!element) return '';

  if (typeof element === 'string') return element.trim();

  // For Puppeteer ElementHandle
  if (element.evaluate) {
    return element.evaluate((el: HTMLElement) => el.textContent?.trim() || '');
  }

  // For JSDOM or similar
  if (element.textContent) {
    return element.textContent.trim();
  }

  return '';
}

/**
 * Extract attribute from an element
 */
export function extractAttribute(element: any, attr: string): string | null {
  if (!element) return null;

  // For Puppeteer ElementHandle
  if (element.evaluate) {
    return element.evaluate((el: Element, attrName: string) => el.getAttribute(attrName), attr);
  }

  // For JSDOM or similar
  if (element.getAttribute) {
    return element.getAttribute(attr);
  }

  return null;
}

/**
 * Parse financial data from listing page
 */
export function parseFinancials(data: Record<string, string>): ParsedFinancials {
  const monthlyRevenue = parseMetricWithSuffix(data.monthlyRevenue || '');
  const monthlyProfit = parseMetricWithSuffix(data.monthlyProfit || '');
  const annualRevenue = parseMetricWithSuffix(data.annualRevenue || '');
  const annualProfit = parseMetricWithSuffix(data.annualProfit || '');

  // Calculate derived values
  let profitMargin: number | null = null;
  if (monthlyRevenue && monthlyProfit) {
    profitMargin = monthlyProfit / monthlyRevenue;
  }

  // Infer annual from monthly if not provided
  const finalAnnualRevenue = annualRevenue || (monthlyRevenue ? monthlyRevenue * 12 : null);
  const finalAnnualProfit = annualProfit || (monthlyProfit ? monthlyProfit * 12 : null);

  return {
    monthlyRevenue,
    monthlyProfit,
    annualRevenue: finalAnnualRevenue,
    annualProfit: finalAnnualProfit,
    profitMargin,
  };
}

/**
 * Parse traffic data from listing page
 */
export function parseTraffic(data: Record<string, string>): ParsedTraffic {
  return {
    monthlyVisitors: parseMetricWithSuffix(data.monthlyVisitors || ''),
    monthlyPageviews: parseMetricWithSuffix(data.monthlyPageviews || ''),
    sources: parseTrafficSources(data.sources || ''),
    bounceRate: parsePercentage(data.bounceRate || ''),
    avgSessionDuration: parseMetricWithSuffix(data.avgSessionDuration || ''),
  };
}

/**
 * Parse traffic sources string
 * Example: "Google: 45%, Direct: 30%, Social: 25%"
 */
export function parseTrafficSources(sourcesStr: string): Record<string, number> {
  if (!sourcesStr) return {};

  const sources: Record<string, number> = {};

  try {
    // Split by common separators
    const parts = sourcesStr.split(/[,;|]/);

    for (const part of parts) {
      // Look for "Source: XX%"
      const match = part.match(/([^:]+):\s*(\d+\.?\d*)%?/);
      if (match) {
        const source = match[1].trim();
        const percentage = parseFloat(match[2]);
        if (!isNaN(percentage)) {
          sources[source] = percentage / 100;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse traffic sources:', sourcesStr, error);
  }

  return sources;
}

/**
 * Parse social followers data
 */
export function parseSocialFollowers(data: Record<string, string>) {
  return {
    instagram: parseMetricWithSuffix(data.instagram || ''),
    twitter: parseMetricWithSuffix(data.twitter || ''),
    facebook: parseMetricWithSuffix(data.facebook || ''),
    tiktok: parseMetricWithSuffix(data.tiktok || ''),
    youtube: parseMetricWithSuffix(data.youtube || ''),
  };
}

/**
 * Extract Flippa listing ID from URL
 * Examples:
 *   https://flippa.com/listings/12345-example -> "12345"
 *   https://flippa.com/12345/example -> "12345"
 */
export function extractFlippaId(url: string): string | null {
  if (!url) return null;

  try {
    // Try various patterns
    const patterns = [
      /\/listings\/(\d+)/,
      /\/(\d+)\//,
      /flippa\.com\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  } catch (error) {
    console.warn('Failed to extract Flippa ID from URL:', url, error);
    return null;
  }
}

/**
 * Normalize category name
 */
export function normalizeCategory(category: string): string {
  if (!category) return 'unknown';

  const normalized = category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  // Map common variations
  const categoryMap: Record<string, string> = {
    'content_site': 'content',
    'content_website': 'content',
    'e_commerce': 'ecommerce',
    'ecommerce_store': 'ecommerce',
    'saas_app': 'saas',
    'software_as_a_service': 'saas',
    'mobile_app': 'app',
    'web_app': 'app',
    'domain_name': 'domain',
  };

  return categoryMap[normalized] || normalized;
}

/**
 * Detect monetization methods from description or data
 */
export function detectMonetizationMethods(description: string, data?: any): string[] {
  const methods: Set<string> = new Set();
  const text = description.toLowerCase();

  const patterns = {
    affiliate: /affiliate|referral|commission/i,
    advertising: /adsense|ad revenue|advertising|display ads/i,
    ecommerce: /ecommerce|sell products|online store|shopify/i,
    subscription: /subscription|recurring|membership|saas/i,
    sponsorship: /sponsor|sponsored content/i,
    digital_products: /digital products|downloads|ebooks|courses/i,
    services: /services|consulting|freelance/i,
    dropshipping: /dropship|drop shipping/i,
  };

  for (const [method, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      methods.add(method);
    }
  }

  return Array.from(methods);
}

/**
 * Detect technologies from description
 */
export function detectTechnologies(description: string): string[] {
  const technologies: Set<string> = new Set();
  const text = description.toLowerCase();

  const techPatterns = {
    wordpress: /wordpress|wp/i,
    shopify: /shopify/i,
    woocommerce: /woocommerce/i,
    magento: /magento/i,
    react: /react(?:js)?/i,
    nextjs: /next\.?js/i,
    nodejs: /node\.?js/i,
    python: /python|django|flask/i,
    php: /php|laravel/i,
    javascript: /javascript|js/i,
    aws: /aws|amazon web services/i,
    cloudflare: /cloudflare/i,
    stripe: /stripe/i,
    paypal: /paypal/i,
  };

  for (const [tech, pattern] of Object.entries(techPatterns)) {
    if (pattern.test(text)) {
      technologies.add(tech);
    }
  }

  return Array.from(technologies);
}

/**
 * Sanitize and truncate description
 */
export function sanitizeDescription(description: string, maxLength: number = 5000): string {
  if (!description) return '';

  // Remove excessive whitespace
  let sanitized = description
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncate if needed
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

/**
 * Validate and clean listing data
 */
export function validateListingData(data: Partial<FlippaListing>): {
  valid: boolean;
  errors: string[];
  cleaned: Partial<FlippaListing>;
} {
  const errors: string[] = [];
  const cleaned: Partial<FlippaListing> = { ...data };

  // Required fields
  if (!data.id || typeof data.id !== 'string') {
    errors.push('Invalid or missing ID');
  }

  if (!data.url || typeof data.url !== 'string') {
    errors.push('Invalid or missing URL');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.length < 3) {
    errors.push('Invalid or missing title');
  }

  if (typeof data.askingPrice !== 'number' || data.askingPrice < 0) {
    errors.push('Invalid asking price');
  }

  // Clean numeric fields
  if (data.monthlyRevenue !== undefined && data.monthlyRevenue !== null) {
    cleaned.monthlyRevenue = Math.max(0, data.monthlyRevenue);
  }

  if (data.monthlyProfit !== undefined && data.monthlyProfit !== null) {
    cleaned.monthlyProfit = Math.max(0, data.monthlyProfit);
  }

  // Validate profit margin
  if (cleaned.monthlyRevenue && cleaned.monthlyProfit) {
    const margin = cleaned.monthlyProfit / cleaned.monthlyRevenue;
    if (margin > 1 || margin < -1) {
      errors.push('Suspicious profit margin (>100% or <-100%)');
    }
  }

  // Clean description
  if (data.description) {
    cleaned.description = sanitizeDescription(data.description);
  }

  // Normalize category
  if (data.category) {
    cleaned.category = normalizeCategory(data.category);
  }

  return {
    valid: errors.length === 0,
    errors,
    cleaned,
  };
}

/**
 * Extract structured data from JSON-LD script tags
 */
export function extractJsonLd(html: string): any[] {
  const results: any[] = [];

  try {
    const scriptMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);

    for (const match of scriptMatches) {
      try {
        const json = JSON.parse(match[1]);
        results.push(json);
      } catch (e) {
        // Skip invalid JSON
      }
    }
  } catch (error) {
    console.warn('Failed to extract JSON-LD:', error);
  }

  return results;
}

/**
 * Calculate deal score based on metrics
 * This is a simple preliminary score before AI analysis
 */
export function calculatePreliminaryScore(listing: Partial<FlippaListing>): number {
  let score = 50; // Start at neutral

  // Price to revenue ratio
  if (listing.askingPrice && listing.annualRevenue && listing.annualRevenue > 0) {
    const multiple = listing.askingPrice / listing.annualRevenue;
    if (multiple < 1.5) score += 20;
    else if (multiple < 2.5) score += 10;
    else if (multiple < 3.5) score += 5;
    else if (multiple > 5) score -= 20;
  }

  // Profit margin
  if (listing.profitMargin) {
    if (listing.profitMargin > 0.5) score += 15;
    else if (listing.profitMargin > 0.3) score += 10;
    else if (listing.profitMargin > 0.15) score += 5;
    else if (listing.profitMargin < 0) score -= 20;
  }

  // Age bonus
  if (listing.ageMonths) {
    if (listing.ageMonths > 36) score += 10; // 3+ years
    else if (listing.ageMonths > 24) score += 5; // 2+ years
    else if (listing.ageMonths < 6) score -= 5; // Less than 6 months
  }

  // Traffic bonus
  if (listing.monthlyVisitors) {
    if (listing.monthlyVisitors > 100000) score += 10;
    else if (listing.monthlyVisitors > 50000) score += 5;
    else if (listing.monthlyVisitors > 10000) score += 3;
  }

  // Verification bonus
  if (listing.verified) score += 10;
  if (listing.sellerVerified) score += 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Parse listing status from text
 */
export function parseStatus(statusText: string): FlippaListing['status'] {
  const normalized = statusText.toLowerCase().trim();

  if (normalized.includes('sold')) return 'sold';
  if (normalized.includes('expired') || normalized.includes('ended')) return 'expired';
  if (normalized.includes('pending')) return 'pending';
  if (normalized.includes('draft')) return 'draft';
  return 'active';
}

/**
 * Format listing data for analysis
 */
export function formatForAnalysis(listing: FlippaListing): string {
  const lines: string[] = [
    `Title: ${listing.title}`,
    `URL: ${listing.url}`,
    `Asking Price: $${listing.askingPrice.toLocaleString()}`,
    `Category: ${listing.category}`,
    '',
  ];

  if (listing.monthlyRevenue) {
    lines.push(`Monthly Revenue: $${listing.monthlyRevenue.toLocaleString()}`);
  }

  if (listing.monthlyProfit) {
    lines.push(`Monthly Profit: $${listing.monthlyProfit.toLocaleString()}`);
  }

  if (listing.profitMargin) {
    lines.push(`Profit Margin: ${(listing.profitMargin * 100).toFixed(1)}%`);
  }

  if (listing.monthlyVisitors) {
    lines.push(`Monthly Visitors: ${listing.monthlyVisitors.toLocaleString()}`);
  }

  if (listing.ageMonths) {
    const years = Math.floor(listing.ageMonths / 12);
    const months = listing.ageMonths % 12;
    lines.push(`Age: ${years > 0 ? `${years} year${years > 1 ? 's' : ''}` : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`.trim());
  }

  if (listing.description) {
    lines.push('');
    lines.push('Description:');
    lines.push(listing.description);
  }

  if (listing.monetizationMethods?.length) {
    lines.push('');
    lines.push(`Monetization: ${listing.monetizationMethods.join(', ')}`);
  }

  if (listing.technologies?.length) {
    lines.push(`Technologies: ${listing.technologies.join(', ')}`);
  }

  return lines.join('\n');
}
