#!/usr/bin/env tsx
/**
 * FlipFlow Scout Agent - CLI Scraper
 * Command-line script to manually run Flippa scraper
 *
 * Usage:
 *   npm run scrape                                    # Scrape with defaults
 *   npm run scrape -- --pages 10 --min-price 1000    # With filters
 *   npm run scrape -- --url <listing-url>            # Scrape single listing
 *   npm run scrape -- --output results.json          # Save to file
 */

import fs from 'fs/promises';
import path from 'path';
import { FlippaScraper, closeScraperInstance } from '../lib/scraper/flippa-scraper';
import type { ScrapeOptions, FlippaListing } from '../lib/scraper/types';

interface CliOptions {
  // Filters
  minPrice?: number;
  maxPrice?: number;
  minRevenue?: number;
  maxRevenue?: number;
  categories?: string[];

  // Scraping
  pages?: number;
  startPage?: number;
  delay?: number;

  // Flags
  onlyActive?: boolean;
  onlyVerified?: boolean;
  onlyFeatured?: boolean;
  excludeAuctions?: boolean;

  // Single listing
  url?: string;

  // Output
  output?: string;
  json?: boolean;
  saveToDb?: boolean;

  // Behavior
  verbose?: boolean;
  help?: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--min-price':
        options.minPrice = parseInt(next);
        i++;
        break;

      case '--max-price':
        options.maxPrice = parseInt(next);
        i++;
        break;

      case '--min-revenue':
        options.minRevenue = parseInt(next);
        i++;
        break;

      case '--max-revenue':
        options.maxRevenue = parseInt(next);
        i++;
        break;

      case '--categories':
      case '-c':
        options.categories = next.split(',').map(c => c.trim());
        i++;
        break;

      case '--pages':
      case '-p':
        options.pages = parseInt(next);
        i++;
        break;

      case '--start-page':
        options.startPage = parseInt(next);
        i++;
        break;

      case '--delay':
      case '-d':
        options.delay = parseInt(next);
        i++;
        break;

      case '--only-active':
        options.onlyActive = true;
        break;

      case '--only-verified':
        options.onlyVerified = true;
        break;

      case '--only-featured':
        options.onlyFeatured = true;
        break;

      case '--exclude-auctions':
        options.excludeAuctions = true;
        break;

      case '--url':
      case '-u':
        options.url = next;
        i++;
        break;

      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;

      case '--json':
        options.json = true;
        break;

      case '--save-to-db':
        options.saveToDb = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
FlipFlow Scout Agent - Flippa Scraper CLI

Usage:
  npm run scrape [options]

Filters:
  --min-price <amount>      Minimum listing price
  --max-price <amount>      Maximum listing price
  --min-revenue <amount>    Minimum monthly revenue
  --max-revenue <amount>    Maximum monthly revenue
  --categories <list>       Comma-separated categories (e.g., "website,app,saas")

Scraping Options:
  --pages, -p <number>      Number of pages to scrape (default: 5)
  --start-page <number>     Page to start from (default: 1)
  --delay, -d <ms>          Delay between requests in milliseconds (default: 2000)

Flags:
  --only-active             Only scrape active listings
  --only-verified           Only scrape verified listings
  --only-featured           Only scrape featured listings
  --exclude-auctions        Exclude auction listings

Single Listing:
  --url, -u <url>           Scrape a single listing by URL

Output:
  --output, -o <file>       Save results to JSON file
  --json                    Output as JSON to stdout
  --save-to-db              Save results to database

Other:
  --verbose, -v             Verbose logging
  --help, -h                Show this help message

Examples:
  # Scrape 10 pages with price filter
  npm run scrape -- --pages 10 --min-price 1000 --max-price 50000

  # Scrape only verified SaaS listings
  npm run scrape -- --categories saas --only-verified

  # Scrape single listing and save to file
  npm run scrape -- --url https://flippa.com/listings/12345 --output listing.json

  # Scrape and save to database
  npm run scrape -- --pages 5 --save-to-db
`);
}

async function saveToFile(data: any, filepath: string): Promise<void> {
  const fullPath = path.resolve(process.cwd(), filepath);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\nResults saved to: ${fullPath}`);
}

async function saveToDatabase(listings: FlippaListing[]): Promise<void> {
  try {
    // TODO: Implement database storage
    console.log(`\nSaving ${listings.length} listings to database...`);
    console.log('Database storage not yet implemented');
  } catch (error) {
    console.error('Failed to save to database:', error);
  }
}

function formatListingSummary(listing: FlippaListing): string {
  const lines: string[] = [
    `\n${'='.repeat(80)}`,
    `Title: ${listing.title}`,
    `URL: ${listing.url}`,
    `Price: $${listing.askingPrice.toLocaleString()}`,
  ];

  if (listing.category) {
    lines.push(`Category: ${listing.category}`);
  }

  if (listing.monthlyRevenue) {
    lines.push(`Monthly Revenue: $${listing.monthlyRevenue.toLocaleString()}`);
  }

  if (listing.monthlyProfit) {
    lines.push(`Monthly Profit: $${listing.monthlyProfit.toLocaleString()}`);
  }

  if (listing.profitMargin !== null) {
    lines.push(`Profit Margin: ${(listing.profitMargin * 100).toFixed(1)}%`);
  }

  if (listing.monthlyVisitors) {
    lines.push(`Monthly Visitors: ${listing.monthlyVisitors.toLocaleString()}`);
  }

  if (listing.ageMonths) {
    const years = Math.floor(listing.ageMonths / 12);
    const months = listing.ageMonths % 12;
    let ageStr = '';
    if (years > 0) ageStr += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) ageStr += ` ${months} month${months > 1 ? 's' : ''}`;
    lines.push(`Age: ${ageStr.trim()}`);
  }

  lines.push(`Status: ${listing.status}`);

  if (listing.verified) lines.push('✓ Verified');
  if (listing.featured) lines.push('★ Featured');

  return lines.join('\n');
}

async function main(): Promise<void> {
  const options = parseArgs();

  // Show help if requested
  if (options.help) {
    printHelp();
    return;
  }

  console.log('FlipFlow Scout Agent - Flippa Scraper\n');

  const scraper = new FlippaScraper();

  try {
    // Single listing mode
    if (options.url) {
      console.log(`Scraping single listing: ${options.url}\n`);

      const listing = await scraper.scrapeListing(options.url);

      if (!listing) {
        console.error('Failed to scrape listing');
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(listing, null, 2));
      } else {
        console.log(formatListingSummary(listing));
      }

      if (options.output) {
        await saveToFile(listing, options.output);
      }

      if (options.saveToDb) {
        await saveToDatabase([listing]);
      }

      return;
    }

    // Multiple listings mode
    const scrapeOptions: ScrapeOptions = {
      maxPages: options.pages || 5,
      startPage: options.startPage || 1,
      delay: options.delay,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      minRevenue: options.minRevenue,
      maxRevenue: options.maxRevenue,
      categories: options.categories,
      onlyActive: options.onlyActive ?? true,
      onlyVerified: options.onlyVerified,
      onlyFeatured: options.onlyFeatured,
      excludeAuctions: options.excludeAuctions,
      includeDescription: true,
    };

    console.log('Scrape options:');
    console.log(JSON.stringify(scrapeOptions, null, 2));
    console.log();

    const result = await scraper.scrapeListings(scrapeOptions);

    // Display results
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('SCRAPE RESULTS');
      console.log('='.repeat(80));
      console.log(`Success: ${result.success ? 'Yes' : 'No'}`);
      console.log(`Listings Found: ${result.metadata.totalFound}`);
      console.log(`Listings Scraped: ${result.metadata.totalScraped}`);
      console.log(`Pages Scraped: ${result.metadata.pagesScraped}`);
      console.log(`Duration: ${(result.metadata.duration / 1000).toFixed(2)}s`);
      console.log(`Errors: ${result.metadata.errors.length}`);

      if (result.metadata.errors.length > 0) {
        console.log('\nErrors:');
        result.metadata.errors.forEach((error, i) => {
          console.log(`  ${i + 1}. [${error.type}] ${error.message}`);
          if (error.url) console.log(`     URL: ${error.url}`);
        });
      }

      if (options.verbose && result.listings.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('LISTINGS');
        console.log('='.repeat(80));

        result.listings.forEach((listing, i) => {
          console.log(formatListingSummary(listing));
        });
      }
    }

    // Save results
    if (options.output) {
      await saveToFile(result, options.output);
    }

    if (options.saveToDb && result.listings.length > 0) {
      await saveToDatabase(result.listings);
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  } finally {
    await closeScraperInstance();
  }
}

// Handle termination signals
process.on('SIGINT', async () => {
  console.log('\n\nReceived SIGINT, shutting down gracefully...');
  await closeScraperInstance();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived SIGTERM, shutting down gracefully...');
  await closeScraperInstance();
  process.exit(0);
});

// Run
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
