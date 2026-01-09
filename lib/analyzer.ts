import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface AnalysisResult {
  score: number;
  dealQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'avoid';
  valuation: {
    asking: number;
    estimated: { min: number; max: number };
    multiple: number;
    fairValue: number;
  };
  risks: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  opportunities: Array<{
    category: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
    estimatedValue: string;
  }>;
  financials: {
    revenue: number | null;
    profit: number | null;
    profitMargin: number | null;
    revenueMultiple: number | null;
  };
  recommendation: {
    action: 'strong_buy' | 'buy' | 'hold' | 'pass' | 'avoid';
    reasoning: string;
    targetPrice: number | null;
  };
  summary: string;
  keyInsights: string[];
}

const ANALYSIS_PROMPT = `You are an expert digital business analyst specializing in evaluating online businesses listed on marketplaces like Flippa. Your role is to provide thorough, objective analysis of business listings.

Analyze the provided business listing data and return a comprehensive JSON analysis with the following structure:

{
  "score": <0-100 integer representing overall deal quality>,
  "dealQuality": <"excellent" | "good" | "fair" | "poor" | "avoid">,
  "valuation": {
    "asking": <asking price in USD>,
    "estimated": { "min": <number>, "max": <number> },
    "multiple": <revenue or profit multiple>,
    "fairValue": <your estimated fair value>
  },
  "risks": [
    {
      "category": <string like "Financial", "Technical", "Market", "Legal">,
      "severity": <"low" | "medium" | "high" | "critical">,
      "description": <detailed risk description>
    }
  ],
  "opportunities": [
    {
      "category": <string like "Revenue", "SEO", "Conversion", "Expansion">,
      "impact": <"low" | "medium" | "high">,
      "description": <detailed opportunity description>,
      "estimatedValue": <e.g., "+$500/mo" or "10-20% revenue increase">
    }
  ],
  "financials": {
    "revenue": <monthly revenue or null>,
    "profit": <monthly profit or null>,
    "profitMargin": <profit margin % or null>,
    "revenueMultiple": <asking price / annual revenue or null>
  },
  "recommendation": {
    "action": <"strong_buy" | "buy" | "hold" | "pass" | "avoid">,
    "reasoning": <detailed explanation>,
    "targetPrice": <your recommended max bid or null>
  },
  "summary": <2-3 sentence executive summary>,
  "keyInsights": [<array of 3-5 key bullet points>]
}

Analysis Guidelines:
1. **Valuation**: Compare to industry multiples (typically 2-4x annual profit for established sites, 1-2x revenue for starter sites)
2. **Red Flags**: Declining traffic, fake metrics, suspicious revenue claims, SEO penalties, trademark issues
3. **Opportunities**: Monetization improvements, SEO gaps, conversion optimization, untapped markets
4. **Deal Score Criteria**:
   - 80-100: Exceptional deal, significantly undervalued
   - 60-79: Good opportunity with clear upside
   - 40-59: Fair deal, requires work
   - 20-39: Poor value or high risk
   - 0-19: Avoid, major red flags

5. **Be Conservative**: It's better to pass on a good deal than overpay for a bad one
6. **Be Specific**: Provide actionable insights with numbers and examples
7. **Consider Context**: Age of business, niche competitiveness, growth trends

Return ONLY the JSON object, no additional text.`;

export async function analyzeFlippaListing(
  listingData: string,
  url?: string
): Promise<AnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `${ANALYSIS_PROMPT}\n\nListing URL: ${url || 'Not provided'}\n\nListing Data:\n${listingData}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }

    const analysis: AnalysisResult = JSON.parse(jsonText);

    // Validate required fields
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      throw new Error('Invalid score in analysis result');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing listing:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 40) return 'bg-yellow-100';
  if (score >= 20) return 'bg-orange-100';
  return 'bg-red-100';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getImpactColor(impact: string): string {
  switch (impact) {
    case 'high': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-blue-600 bg-blue-100';
    case 'low': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
