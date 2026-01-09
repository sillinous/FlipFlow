/**
 * Tests for Job Queue functionality
 */

import { JobQueue } from '@/lib/queue';
import type { ScrapeJobData, AnalyzeJobData } from '@/lib/queue';

// Increase timeout for queue tests
jest.setTimeout(10000);

describe('JobQueue', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue({
      maxConcurrent: 0, // Disable auto-processing for tests
      maxRetries: 2,
      retryDelay: 100,
      jobTimeout: 5000,
      cleanupInterval: 600000, // Long interval to avoid interference
      maxQueueSize: 100,
    });
  });

  afterEach(() => {
    queue.stopCleanup();
    queue.clear();
  });

  describe('add()', () => {
    it('should add a job to the queue', () => {
      const job = queue.add('scrape', { source: 'manual' } as ScrapeJobData);

      expect(job).toBeDefined();
      expect(job.id).toMatch(/^job_/);
      expect(job.type).toBe('scrape');
      expect(job.status).toBe('pending');
      expect(job.data.source).toBe('manual');
    });

    it('should respect priority ordering', () => {
      const lowPriority = queue.add('scrape', { source: 'api' } as ScrapeJobData, { priority: 1 });
      const highPriority = queue.add('scrape', { source: 'webhook' } as ScrapeJobData, { priority: 10 });

      // High priority should be processed first
      expect(highPriority.priority).toBeGreaterThan(lowPriority.priority);
    });

    it('should throw error when queue is full', () => {
      const smallQueue = new JobQueue({ maxQueueSize: 2, maxConcurrent: 0 });

      smallQueue.add('scrape', { source: 'api' } as ScrapeJobData);
      smallQueue.add('scrape', { source: 'api' } as ScrapeJobData);

      expect(() => {
        smallQueue.add('scrape', { source: 'api' } as ScrapeJobData);
      }).toThrow('Queue is full');

      smallQueue.stopCleanup();
    });
  });

  describe('get()', () => {
    it('should retrieve a job by ID', () => {
      const addedJob = queue.add('analyze', {
        listingId: 'test-123',
        listingUrl: 'https://flippa.com/test',
      } as AnalyzeJobData);

      const retrievedJob = queue.get(addedJob.id);

      expect(retrievedJob).toBeDefined();
      expect(retrievedJob?.id).toBe(addedJob.id);
      expect(retrievedJob?.data.listingId).toBe('test-123');
    });

    it('should return null for non-existent job', () => {
      const job = queue.get('non-existent-id');
      expect(job).toBeNull();
    });
  });

  describe('getAll()', () => {
    it('should return all jobs', () => {
      queue.add('scrape', { source: 'api' } as ScrapeJobData);
      queue.add('analyze', { listingId: 'test' } as AnalyzeJobData);
      queue.add('alert', { userId: 'user-1', alertId: 'alert-1', listings: [] });

      const jobs = queue.getAll();
      expect(jobs).toHaveLength(3);
    });

    it('should filter by type', () => {
      queue.add('scrape', { source: 'api' } as ScrapeJobData);
      queue.add('analyze', { listingId: 'test' } as AnalyzeJobData);
      queue.add('scrape', { source: 'webhook' } as ScrapeJobData);

      const scrapeJobs = queue.getAll({ type: 'scrape' });
      expect(scrapeJobs).toHaveLength(2);
    });
  });

  describe('cancel()', () => {
    it('should cancel a pending job', () => {
      const job = queue.add('scrape', { source: 'api' } as ScrapeJobData);

      const cancelled = queue.cancel(job.id);

      expect(cancelled).toBe(true);
      expect(queue.get(job.id)?.status).toBe('cancelled');
    });

    it('should return false for non-existent job', () => {
      const cancelled = queue.cancel('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('remove()', () => {
    it('should remove a cancelled job from the queue', () => {
      const job = queue.add('scrape', { source: 'api' } as ScrapeJobData);
      queue.cancel(job.id); // Cancel first so it's not processing

      const removed = queue.remove(job.id);

      expect(removed).toBe(true);
      expect(queue.get(job.id)).toBeNull();
    });

    it('should return false for non-existent job', () => {
      const removed = queue.remove('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      queue.add('scrape', { source: 'api' } as ScrapeJobData);
      queue.add('analyze', { listingId: 'test' } as AnalyzeJobData);
      const job3 = queue.add('alert', { userId: 'user-1', alertId: 'alert-1', listings: [] });
      queue.cancel(job3.id);

      const stats = queue.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(2);
      expect(stats.cancelled).toBe(1);
      expect(stats.byType.scrape).toBe(1);
      expect(stats.byType.analyze).toBe(1);
      expect(stats.byType.alert).toBe(1);
    });
  });

  describe('cleanup()', () => {
    it('should remove old completed jobs', () => {
      const job = queue.add('scrape', { source: 'api' } as ScrapeJobData);

      // Manually mark as completed with old date
      const jobRef = queue.get(job.id);
      if (jobRef) {
        jobRef.status = 'completed';
        jobRef.completedAt = new Date(Date.now() - 100000); // 100 seconds ago
      }

      const removed = queue.cleanup(1000); // 1 second max age

      expect(removed).toBe(1);
      expect(queue.get(job.id)).toBeNull();
    });
  });

  describe('clear()', () => {
    it('should remove all jobs', () => {
      queue.add('scrape', { source: 'api' } as ScrapeJobData);
      queue.add('analyze', { listingId: 'test' } as AnalyzeJobData);

      queue.clear();

      expect(queue.getAll()).toHaveLength(0);
    });
  });
});
