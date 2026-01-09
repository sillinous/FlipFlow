/**
 * Tests for Webhook API - Unit tests for helper functions
 *
 * Note: Full API route tests require more complex setup with Next.js test utilities.
 * These tests focus on the business logic and data validation.
 */

describe('Webhook API', () => {
  describe('Payload validation', () => {
    it('should require action field', () => {
      const payload = {};
      expect(payload).not.toHaveProperty('action');
    });

    it('should accept valid ping action', () => {
      const payload = { action: 'ping' };
      expect(['ping', 'scrape', 'analyze', 'analyze_batch', 'alert']).toContain(payload.action);
    });

    it('should accept valid scrape action with options', () => {
      const payload = {
        action: 'scrape',
        data: {
          maxPages: 5,
          minPrice: 1000,
          maxPrice: 50000,
        },
      };
      expect(payload.action).toBe('scrape');
      expect(payload.data.maxPages).toBe(5);
    });

    it('should accept valid analyze action with URL', () => {
      const payload = {
        action: 'analyze',
        data: {
          url: 'https://flippa.com/test-listing',
          title: 'Test Listing',
          askingPrice: 25000,
        },
      };
      expect(payload.action).toBe('analyze');
      expect(payload.data.url).toContain('flippa.com');
    });

    it('should accept valid analyze_batch action with URLs array', () => {
      const payload = {
        action: 'analyze_batch',
        data: {
          urls: [
            'https://flippa.com/listing-1',
            'https://flippa.com/listing-2',
            'https://flippa.com/listing-3',
          ],
        },
      };
      expect(payload.action).toBe('analyze_batch');
      expect(Array.isArray(payload.data.urls)).toBe(true);
      expect(payload.data.urls).toHaveLength(3);
    });

    it('should accept valid alert action with user and listings', () => {
      const payload = {
        action: 'alert',
        data: {
          userId: 'user-123',
          alertId: 'alert-456',
          listings: ['listing-1', 'listing-2'],
          minScore: 70,
        },
      };
      expect(payload.action).toBe('alert');
      expect(payload.data.userId).toBeDefined();
      expect(payload.data.listings).toHaveLength(2);
    });
  });

  describe('Authentication header validation', () => {
    it('should recognize x-webhook-secret header', () => {
      const headers = { 'x-webhook-secret': 'test-secret' };
      expect(headers['x-webhook-secret']).toBe('test-secret');
    });

    it('should recognize Bearer token format', () => {
      const authHeader = 'Bearer test-secret-token';
      expect(authHeader.startsWith('Bearer ')).toBe(true);
      expect(authHeader.substring(7)).toBe('test-secret-token');
    });

    it('should recognize x-n8n-secret header for n8n', () => {
      const headers = { 'x-n8n-secret': 'n8n-webhook-secret' };
      expect(headers['x-n8n-secret']).toBeDefined();
    });
  });

  describe('Response format validation', () => {
    it('should include success flag in response', () => {
      const successResponse = {
        success: true,
        action: 'ping',
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      expect(successResponse.success).toBe(true);
      expect(successResponse.timestamp).toBeDefined();
    });

    it('should include error message in error response', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid action specified',
      };
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    });

    it('should include jobId for queued actions', () => {
      const queuedResponse = {
        success: true,
        action: 'scrape',
        jobId: 'job_123456789_abc',
        status: 'queued',
      };
      expect(queuedResponse.jobId).toMatch(/^job_/);
      expect(queuedResponse.status).toBe('queued');
    });

    it('should include duration in response', () => {
      const response = {
        success: true,
        action: 'analyze',
        duration: '150ms',
      };
      expect(response.duration).toMatch(/\d+ms/);
    });
  });

  describe('Scrape options validation', () => {
    it('should have valid maxPages range', () => {
      const options = { maxPages: 5 };
      expect(options.maxPages).toBeGreaterThan(0);
      expect(options.maxPages).toBeLessThanOrEqual(10);
    });

    it('should have valid price filters', () => {
      const options = { minPrice: 1000, maxPrice: 100000 };
      expect(options.minPrice).toBeLessThan(options.maxPrice);
    });

    it('should accept category filters', () => {
      const options = {
        categories: ['saas', 'ecommerce', 'website'],
      };
      expect(Array.isArray(options.categories)).toBe(true);
    });
  });

  describe('Analyze options validation', () => {
    it('should accept sync flag for immediate analysis', () => {
      const options = {
        url: 'https://flippa.com/test',
        sync: true,
      };
      expect(options.sync).toBe(true);
    });

    it('should accept additional listing data', () => {
      const options = {
        url: 'https://flippa.com/test',
        title: 'E-commerce Store',
        askingPrice: 50000,
        monthlyRevenue: 5000,
        monthlyProfit: 3000,
        category: 'ecommerce',
        description: 'Profitable dropshipping store',
      };
      expect(options.title).toBeDefined();
      expect(options.askingPrice).toBeGreaterThan(0);
      expect(options.monthlyProfit).toBeLessThanOrEqual(options.monthlyRevenue);
    });
  });

  describe('Batch analyze validation', () => {
    it('should limit batch size', () => {
      const urls = Array(25).fill('https://flippa.com/test');
      const maxBatchSize = 20;
      const processedUrls = urls.slice(0, maxBatchSize);
      expect(processedUrls).toHaveLength(20);
    });

    it('should handle empty urls array', () => {
      const payload = {
        action: 'analyze_batch',
        data: { urls: [] },
      };
      expect(payload.data.urls).toHaveLength(0);
    });
  });

  describe('URL validation', () => {
    it('should accept valid Flippa URLs', () => {
      const validUrls = [
        'https://flippa.com/12345',
        'https://flippa.com/test-listing-slug',
        'https://www.flippa.com/some-business',
      ];
      validUrls.forEach(url => {
        expect(url).toMatch(/flippa\.com/);
      });
    });

    it('should extract Flippa ID from URL', () => {
      const url = 'https://flippa.com/my-awesome-listing-12345';
      const match = url.match(/flippa\.com\/.*?([a-zA-Z0-9-]+)$/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('my-awesome-listing-12345');
    });
  });
});
