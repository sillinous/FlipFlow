// jest.setup.js
import '@testing-library/jest-dom';

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Request and Response for Anthropic SDK compatibility
global.Request = jest.fn();
global.Response = jest.fn();
global.Headers = jest.fn(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  forEach: jest.fn(),
}));

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              score: 75,
              dealQuality: 'good',
              valuation: {
                asking: 50000,
                estimated: { min: 40000, max: 60000 },
                multiple: 2.5,
                fairValue: 48000,
              },
              risks: [],
              opportunities: [],
              financials: {
                revenue: 2000,
                profit: 1500,
                profitMargin: 75,
                revenueMultiple: 2.1,
              },
              recommendation: {
                action: 'buy',
                reasoning: 'Good opportunity',
                targetPrice: 45000,
              },
              summary: 'A solid business.',
              keyInsights: ['Good margins'],
            }),
          }],
        }),
      },
    })),
  };
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
