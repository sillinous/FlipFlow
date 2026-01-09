/**
 * FlipFlow Scout Agent - Flippa Scraper
 * Main scraper class for automated Flippa listing scraping
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import type {
  FlippaListing,
  ScrapeOptions,
  ScrapeResult,
  ScrapeError,
  ScraperConfig,
  RateLimitError,
  ScrapeTimeoutError,
  NetworkError,
} from './types';
import {
  DEFAULT_SCRAPER_CONFIG,
  FLIPPA_SELECTORS,
  FLIPPA_URLS,
} from './types';
import {
  parsePrice,
  parseMetricWithSuffix,
  parseAge,
  extractFlippaId,
  normalizeCategory,
  detectMonetizationMethods,
  detectTechnologies,
  sanitizeDescription,
  validateListingData,
  parseStatus,
  parseFinancials,
  parseTraffic,
} from './parser';

export class FlippaScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private rateLimitResetTime: number = 0;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = { ...DEFAULT_SCRAPER_CONFIG, ...config };
  }

  /**
   * Initialize browser instance
   */
  async init(): Promise<void> {
    if (this.browser) {
      console.log('Browser already initialized');
      return;
    }

    console.log('Initializing browser...');

    const launchOptions: any = {
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    };

    // Add proxy if configured
    if (this.config.proxy?.enabled && this.config.proxy.url) {
      launchOptions.args.push(`--proxy-server=${this.config.proxy.url}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
    console.log('Browser initialized successfully');
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Browser closed');
    }
  }

  /**
   * Create a new page with configured settings
   */
  private async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();

    // Set viewport
    await page.setViewport(this.config.viewport);

    // Set user agent
    await page.setUserAgent(this.config.userAgent);

    // Set default timeout
    page.setDefaultTimeout(this.config.defaultTimeout);

    // Proxy authentication if needed
    if (this.config.proxy?.enabled && this.config.proxy.username && this.config.proxy.password) {
      await page.authenticate({
        username: this.config.proxy.username,
        password: this.config.proxy.password,
      });
    }

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    return page;
  }

  /**
   * Respect rate limits
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();

    // Check if we're in cooldown period
    if (this.rateLimitResetTime > now) {
      const waitTime = this.rateLimitResetTime - now;
      console.log(`Rate limit cooldown: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.rateLimitResetTime = 0;
      this.requestCount = 0;
    }

    // Calculate time since last request
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 1000 / this.config.rateLimit.requestsPerSecond;

    // Add randomization to delay if configured
    let delay = Math.max(0, minDelay - timeSinceLastRequest);
    if (this.config.randomizeDelay && delay > 0) {
      delay = delay * (0.8 + Math.random() * 0.4); // ±20% variance
    }

    if (delay > 0) {
      await this.sleep(delay);
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Scrape listings from Flippa marketplace
   */
  async scrapeListings(options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const startTime = new Date();
    const listings: FlippaListing[] = [];
    const errors: ScrapeError[] = [];

    let page: Page | null = null;

    try {
      // Initialize browser
      await this.init();

      // Apply defaults
      const opts: Required<ScrapeOptions> = {
        maxPages: options.maxPages || 5,
        itemsPerPage: options.itemsPerPage || 20,
        startPage: options.startPage || 1,
        delay: options.delay || this.config.defaultDelay,
        timeout: options.timeout || this.config.defaultTimeout,
        includeDescription: options.includeDescription ?? true,
        includeScreenshots: options.includeScreenshots ?? false,
        includeRawHtml: options.includeRawHtml ?? false,
        onlyActive: options.onlyActive ?? true,
        onlyVerified: options.onlyVerified ?? false,
        onlyFeatured: options.onlyFeatured ?? false,
        excludeAuctions: options.excludeAuctions ?? false,
        useProxy: options.useProxy ?? this.config.proxy?.enabled ?? false,
        maxRetries: options.maxRetries || this.config.maxRetries,
        retryDelay: options.retryDelay || this.config.retryDelay,
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
        minRevenue: options.minRevenue,
        maxRevenue: options.maxRevenue,
        categories: options.categories,
        subcategories: options.subcategories,
        monetizationTypes: options.monetizationTypes,
        proxyUrl: options.proxyUrl,
        userAgent: options.userAgent,
        cookies: options.cookies,
        headers: options.headers,
      };

      console.log(`Starting scrape with options:`, opts);

      // Create page
      page = await this.createPage();

      // Build search URL
      const searchUrl = this.buildSearchUrl(opts);
      console.log(`Navigating to: ${searchUrl}`);

      // Navigate to search page
      await this.respectRateLimit();
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout,
      });

      // Scrape multiple pages
      let currentPage = opts.startPage;
      let totalScraped = 0;

      while (currentPage < opts.startPage + opts.maxPages) {
        console.log(`Scraping page ${currentPage}...`);

        try {
          // Extract listings from current page
          const pageListings = await this.extractListingsFromPage(page, opts);
          listings.push(...pageListings);
          totalScraped += pageListings.length;

          console.log(`Scraped ${pageListings.length} listings from page ${currentPage}`);

          // Check if there are more pages
          const hasNextPage = await this.hasNextPage(page);
          if (!hasNextPage) {
            console.log('No more pages available');
            break;
          }

          // Navigate to next page
          currentPage++;
          if (currentPage < opts.startPage + opts.maxPages) {
            await this.respectRateLimit();
            await this.navigateToNextPage(page);
          }
        } catch (error) {
          const scrapeError: ScrapeError = {
            timestamp: new Date(),
            type: 'parsing',
            message: error instanceof Error ? error.message : 'Unknown error',
            url: page.url(),
            details: error,
          };
          errors.push(scrapeError);
          console.error(`Error on page ${currentPage}:`, error);

          // Continue to next page on error
          currentPage++;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log(`Scrape completed: ${listings.length} listings in ${duration}ms`);

      return {
        success: listings.length > 0,
        listings,
        metadata: {
          totalFound: listings.length,
          totalScraped: listings.length,
          pagesScraped: currentPage - opts.startPage,
          startTime,
          endTime,
          duration,
          errors,
        },
        filters: opts,
      };
    } catch (error) {
      const scrapeError: ScrapeError = {
        timestamp: new Date(),
        type: error instanceof ScrapeTimeoutError ? 'timeout' :
               error instanceof RateLimitError ? 'rate_limit' :
               error instanceof NetworkError ? 'network' : 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      };
      errors.push(scrapeError);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        success: false,
        listings,
        metadata: {
          totalFound: 0,
          totalScraped: listings.length,
          pagesScraped: 0,
          startTime,
          endTime,
          duration,
          errors,
        },
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Scrape a single listing by URL
   */
  async scrapeListing(url: string, options: Partial<ScrapeOptions> = {}): Promise<FlippaListing | null> {
    let page: Page | null = null;

    try {
      await this.init();
      page = await this.createPage();

      console.log(`Scraping listing: ${url}`);

      await this.respectRateLimit();
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || this.config.defaultTimeout,
      });

      const listing = await this.extractListingDetails(page, url, options);
      return listing;
    } catch (error) {
      console.error(`Error scraping listing ${url}:`, error);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Build search URL with filters
   */
  private buildSearchUrl(options: ScrapeOptions): string {
    const baseUrl = `${this.config.baseUrl}${FLIPPA_URLS.search}`;
    const params = new URLSearchParams();

    // Price filters
    if (options.minPrice) {
      params.append('filter[price][min]', options.minPrice.toString());
    }
    if (options.maxPrice) {
      params.append('filter[price][max]', options.maxPrice.toString());
    }

    // Revenue filters
    if (options.minRevenue) {
      params.append('filter[revenue][min]', options.minRevenue.toString());
    }
    if (options.maxRevenue) {
      params.append('filter[revenue][max]', options.maxRevenue.toString());
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      params.append('filter[property_type]', options.categories.join(','));
    }

    // Status filters
    if (options.onlyActive) {
      params.append('filter[status]', 'active');
    }
    if (options.onlyVerified) {
      params.append('filter[verified]', '1');
    }
    if (options.onlyFeatured) {
      params.append('filter[featured]', '1');
    }
    if (options.excludeAuctions) {
      params.append('filter[sale_method]', 'fixed_price');
    }

    // Pagination
    if (options.startPage && options.startPage > 1) {
      params.append('page', options.startPage.toString());
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Extract listings from current page
   */
  private async extractListingsFromPage(page: Page, options: ScrapeOptions): Promise<FlippaListing[]> {
    const listings: FlippaListing[] = [];

    try {
      // Wait for listings to load
      await page.waitForSelector(FLIPPA_SELECTORS.listingCard, {
        timeout: 10000,
      }).catch(() => {
        console.warn('Listing cards not found, trying alternative selectors');
      });

      // Extract listing URLs
      const listingUrls = await page.evaluate((selectors) => {
        const links: string[] = [];
        const elements = document.querySelectorAll(selectors.listingLink);

        elements.forEach((el) => {
          const href = el.getAttribute('href');
          if (href && href.includes('/listings/')) {
            const fullUrl = href.startsWith('http') ? href : `https://flippa.com${href}`;
            links.push(fullUrl);
          }
        });

        return links;
      }, FLIPPA_SELECTORS);

      console.log(`Found ${listingUrls.length} listing URLs on page`);

      // Extract details for each listing
      for (const url of listingUrls) {
        try {
          const listing = await this.scrapeListing(url, options);
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          console.error(`Failed to scrape listing ${url}:`, error);
        }
      }
    } catch (error) {
      console.error('Error extracting listings from page:', error);
    }

    return listings;
  }

  /**
   * Extract detailed listing information
   */
  private async extractListingDetails(
    page: Page,
    url: string,
    options: Partial<ScrapeOptions>
  ): Promise<FlippaListing | null> {
    try {
      // Extract data from page
      const data = await page.evaluate((selectors) => {
        const getText = (selector: string): string => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || '';
        };

        const getAttribute = (selector: string, attr: string): string => {
          const el = document.querySelector(selector);
          return el?.getAttribute(attr) || '';
        };

        return {
          title: getText(selectors.detailTitle),
          description: getText(selectors.detailDescription),
          price: getText(selectors.detailPrice),
          revenue: getText(selectors.detailRevenue),
          profit: getText(selectors.detailProfit),
          traffic: getText(selectors.detailTraffic),
          age: getText(selectors.detailAge),
          category: getText(selectors.listingCategory),
          status: getText(selectors.soldBadge) ? 'sold' : 'active',
          featured: !!document.querySelector(selectors.featuredBadge),
          verified: !!document.querySelector(selectors.verifiedBadge),
          rawHtml: document.body.innerHTML,
        };
      }, FLIPPA_SELECTORS);

      // Parse extracted data
      const flippaId = extractFlippaId(url);
      if (!flippaId) {
        console.warn(`Could not extract Flippa ID from URL: ${url}`);
        return null;
      }

      // Parse financial data
      const financials = parseFinancials({
        monthlyRevenue: data.revenue,
        monthlyProfit: data.profit,
        annualRevenue: '',
        annualProfit: '',
      });

      // Build listing object
      const listing: FlippaListing = {
        id: flippaId,
        url,
        flippaId,
        title: data.title,
        description: options.includeDescription ? sanitizeDescription(data.description) : '',
        category: normalizeCategory(data.category),
        askingPrice: parsePrice(data.price) || 0,
        currency: 'USD',
        priceType: 'fixed',
        monthlyRevenue: financials.monthlyRevenue,
        monthlyProfit: financials.monthlyProfit,
        annualRevenue: financials.annualRevenue,
        annualProfit: financials.annualProfit,
        profitMargin: financials.profitMargin,
        monthlyVisitors: parseMetricWithSuffix(data.traffic),
        monthlyPageviews: null,
        ageMonths: parseAge(data.age),
        monetizationMethods: detectMonetizationMethods(data.description),
        technologies: detectTechnologies(data.description),
        listingDate: new Date(),
        status: parseStatus(data.status),
        featured: data.featured,
        verified: data.verified,
        rawHtml: options.includeRawHtml ? data.rawHtml : undefined,
        scrapedAt: new Date(),
        lastUpdated: new Date(),
        scrapeSource: 'puppeteer',
      };

      // Validate and clean
      const validation = validateListingData(listing);
      if (!validation.valid) {
        console.warn(`Listing validation failed for ${url}:`, validation.errors);
        // Continue anyway with cleaned data
      }

      return validation.cleaned as FlippaListing;
    } catch (error) {
      console.error(`Error extracting listing details from ${url}:`, error);
      return null;
    }
  }

  /**
   * Check if there's a next page
   */
  private async hasNextPage(page: Page): Promise<boolean> {
    try {
      const nextButton = await page.$(FLIPPA_SELECTORS.nextPage);
      if (!nextButton) return false;

      const isDisabled = await page.evaluate((btn) => {
        return btn?.hasAttribute('disabled') || btn?.getAttribute('aria-disabled') === 'true';
      }, nextButton);

      return !isDisabled;
    } catch (error) {
      console.error('Error checking for next page:', error);
      return false;
    }
  }

  /**
   * Navigate to next page
   */
  private async navigateToNextPage(page: Page): Promise<void> {
    try {
      await page.click(FLIPPA_SELECTORS.nextPage);
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: this.config.defaultTimeout,
      });
    } catch (error) {
      throw new Error(`Failed to navigate to next page: ${error}`);
    }
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitActive: this.rateLimitResetTime > Date.now(),
    };
  }

  /**
   * Reset rate limit counters
   */
  resetRateLimit() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitResetTime = 0;
  }
}

// Export singleton instance
let scraperInstance: FlippaScraper | null = null;

export function getScraperInstance(config?: Partial<ScraperConfig>): FlippaScraper {
  if (!scraperInstance) {
    scraperInstance = new FlippaScraper(config);
  }
  return scraperInstance;
}

export async function closeScraperInstance(): Promise<void> {
  if (scraperInstance) {
    await scraperInstance.close();
    scraperInstance = null;
  }
}
