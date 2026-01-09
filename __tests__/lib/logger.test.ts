/**
 * Tests for Logger functionality
 */

import { Logger, generateRequestId } from '@/lib/logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      log: jest.spyOn(console, 'log').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
    // Set LOG_LEVEL to debug for tests
    process.env.LOG_LEVEL = 'debug';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  describe('log levels', () => {
    it('should log info messages', () => {
      const testLogger = new Logger();
      testLogger.info('Info message');

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toContain('[INFO]');
    });

    it('should log warn messages', () => {
      const testLogger = new Logger();
      testLogger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.warn.mock.calls[0][0]).toContain('[WARN]');
    });

    it('should log error messages', () => {
      const testLogger = new Logger();
      testLogger.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.error.mock.calls[0][0]).toContain('[ERROR]');
    });
  });

  describe('context handling', () => {
    it('should include context in log output', () => {
      const testLogger = new Logger();
      testLogger.info('Test message', { userId: 'user-123', action: 'test' });

      expect(consoleSpy.log.mock.calls[0][0]).toContain('user-123');
      expect(consoleSpy.log.mock.calls[0][0]).toContain('action');
    });

    it('should persist context with setContext', () => {
      const testLogger = new Logger();
      testLogger.setContext({ requestId: 'req-abc' });
      testLogger.info('Message 1');
      testLogger.info('Message 2');

      expect(consoleSpy.log.mock.calls[0][0]).toContain('req-abc');
      expect(consoleSpy.log.mock.calls[1][0]).toContain('req-abc');
    });

    it('should clear context', () => {
      const testLogger = new Logger();
      testLogger.setContext({ requestId: 'req-abc' });
      testLogger.clearContext();
      testLogger.info('Message');

      // After clear, context should be empty (no ctx in output)
      const logOutput = consoleSpy.log.mock.calls[0][0];
      expect(logOutput).not.toContain('req-abc');
    });
  });

  describe('child logger', () => {
    it('should create child logger with inherited context', () => {
      const testLogger = new Logger();
      testLogger.setContext({ service: 'main' });

      const childLogger = testLogger.child({ requestId: 'req-123' });
      childLogger.info('Child message');

      expect(consoleSpy.log.mock.calls[0][0]).toContain('service');
      expect(consoleSpy.log.mock.calls[0][0]).toContain('requestId');
    });
  });

  describe('error logging', () => {
    it('should include error details', () => {
      const testLogger = new Logger();
      const error = new Error('Test error');

      testLogger.error('Something failed', error);

      expect(consoleSpy.error.mock.calls[0][0]).toContain('Test error');
    });

    it('should handle non-Error objects', () => {
      const testLogger = new Logger();

      testLogger.error('Failed', 'string error');

      expect(consoleSpy.error.mock.calls[0][0]).toContain('string error');
    });
  });

  describe('specialized log methods', () => {
    it('should log requests', () => {
      const testLogger = new Logger();
      testLogger.logRequest({
        method: 'GET',
        url: '/api/test',
        userAgent: 'Mozilla/5.0',
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toContain('GET /api/test');
    });

    it('should log responses with appropriate level for success', () => {
      const testLogger = new Logger();
      testLogger.logResponse({ statusCode: 200, duration: 50, url: '/api/test' });
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log responses with warn level for client errors', () => {
      const testLogger = new Logger();
      testLogger.logResponse({ statusCode: 404, duration: 50, url: '/api/test' });
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log responses with error level for server errors', () => {
      const testLogger = new Logger();
      testLogger.logResponse({ statusCode: 500, duration: 50, url: '/api/test' });
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log job execution', () => {
      const testLogger = new Logger();

      testLogger.logJob({
        type: 'scrape',
        id: 'job-123',
        status: 'completed',
        duration: 5000,
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toContain('Job scrape completed');
    });

    it('should log analysis results', () => {
      const testLogger = new Logger();

      testLogger.logAnalysis({
        listingId: 'listing-123',
        score: 75,
        dealQuality: 'good',
        duration: 3000,
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toContain('score=75');
    });

    it('should log scrape results', () => {
      const testLogger = new Logger();

      testLogger.logScrape({
        listingsFound: 25,
        pagesScraped: 3,
        duration: 30000,
        errors: 0,
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(consoleSpy.log.mock.calls[0][0]).toContain('25 listings');
    });
  });
});

describe('generateRequestId()', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
  });

  it('should start with req_ prefix', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_/);
  });

  it('should have consistent format', () => {
    const id = generateRequestId();
    // Format: req_{timestamp}_{random}
    expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
  });
});
