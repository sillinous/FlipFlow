/**
 * Tests for Analyzer functionality
 */

import {
  formatCurrency,
  getScoreColor,
  getScoreBgColor,
  getSeverityColor,
  getImpactColor,
} from '@/lib/analyzer';

describe('Analyzer Utilities', () => {
  describe('formatCurrency()', () => {
    it('should format small amounts', () => {
      expect(formatCurrency(500)).toBe('$500');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should format thousands', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(15000)).toBe('$15,000');
      expect(formatCurrency(999999)).toBe('$999,999');
    });

    it('should format millions', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(2500000)).toBe('$2,500,000');
    });
  });

  describe('getScoreColor()', () => {
    it('should return green for excellent scores (80+)', () => {
      expect(getScoreColor(80)).toBe('text-green-600');
      expect(getScoreColor(95)).toBe('text-green-600');
      expect(getScoreColor(100)).toBe('text-green-600');
    });

    it('should return blue for good scores (60-79)', () => {
      expect(getScoreColor(60)).toBe('text-blue-600');
      expect(getScoreColor(70)).toBe('text-blue-600');
      expect(getScoreColor(79)).toBe('text-blue-600');
    });

    it('should return yellow for fair scores (40-59)', () => {
      expect(getScoreColor(40)).toBe('text-yellow-600');
      expect(getScoreColor(50)).toBe('text-yellow-600');
      expect(getScoreColor(59)).toBe('text-yellow-600');
    });

    it('should return orange for poor scores (20-39)', () => {
      expect(getScoreColor(20)).toBe('text-orange-600');
      expect(getScoreColor(30)).toBe('text-orange-600');
      expect(getScoreColor(39)).toBe('text-orange-600');
    });

    it('should return red for avoid scores (<20)', () => {
      expect(getScoreColor(0)).toBe('text-red-600');
      expect(getScoreColor(10)).toBe('text-red-600');
      expect(getScoreColor(19)).toBe('text-red-600');
    });
  });

  describe('getScoreBgColor()', () => {
    it('should return appropriate background colors', () => {
      expect(getScoreBgColor(85)).toBe('bg-green-100');
      expect(getScoreBgColor(65)).toBe('bg-blue-100');
      expect(getScoreBgColor(45)).toBe('bg-yellow-100');
      expect(getScoreBgColor(25)).toBe('bg-orange-100');
      expect(getScoreBgColor(10)).toBe('bg-red-100');
    });
  });

  describe('getSeverityColor()', () => {
    it('should return correct colors for each severity', () => {
      expect(getSeverityColor('critical')).toBe('text-red-600 bg-red-100');
      expect(getSeverityColor('high')).toBe('text-orange-600 bg-orange-100');
      expect(getSeverityColor('medium')).toBe('text-yellow-600 bg-yellow-100');
      expect(getSeverityColor('low')).toBe('text-blue-600 bg-blue-100');
    });

    it('should return gray for unknown severity', () => {
      expect(getSeverityColor('unknown')).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('getImpactColor()', () => {
    it('should return correct colors for each impact level', () => {
      expect(getImpactColor('high')).toBe('text-green-600 bg-green-100');
      expect(getImpactColor('medium')).toBe('text-blue-600 bg-blue-100');
      expect(getImpactColor('low')).toBe('text-gray-600 bg-gray-100');
    });

    it('should return gray for unknown impact', () => {
      expect(getImpactColor('unknown')).toBe('text-gray-600 bg-gray-100');
    });
  });
});

// Note: The Anthropic SDK is mocked in jest.setup.js

describe('analyzeFlippaListing()', () => {
  it('should be defined', async () => {
    const { analyzeFlippaListing } = await import('@/lib/analyzer');
    expect(analyzeFlippaListing).toBeDefined();
    expect(typeof analyzeFlippaListing).toBe('function');
  });

  it('should return analysis result with expected structure', async () => {
    const { analyzeFlippaListing } = await import('@/lib/analyzer');
    const result = await analyzeFlippaListing('Test listing data', 'https://flippa.com/test');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('dealQuality');
    expect(result).toHaveProperty('valuation');
    expect(result).toHaveProperty('risks');
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('financials');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyInsights');
  });

  it('should return valid score between 0 and 100', async () => {
    const { analyzeFlippaListing } = await import('@/lib/analyzer');
    const result = await analyzeFlippaListing('Test listing data');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
