import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { FlippaListing } from './flippa'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const FlipScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  financials: z.number().min(0).max(100),
  traffic: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  growth: z.number().min(0).max(100),
  operations: z.number().min(0).max(100),
})

const RedFlagSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  description: z.string(),
})

const GrowthOpportunitySchema = z.object({
  impact: z.enum(['low', 'medium', 'high']),
  title: z.string(),
  description: z.string(),
  effort: z.string(),
})

const FlipPlanSchema = z.object({
  months_1_3: z.string(),
  months_4_6: z.string(),
  months_7_12: z.string(),
  target_exit_multiple: z.number(),
  key_value_drivers: z.array(z.string()),
})

const ROIScenarioSchema = z.object({
  label: z.string(),
  exit_value: z.number(),
  roi_percent: z.number(),
  timeline_months: z.number(),
  assumptions: z.string(),
})

const NegotiationSchema = z.object({
  target_price: z.number(),
  walk_away_price: z.number(),
  leverage_points: z.array(z.string()),
  due_diligence_questions: z.array(z.string()),
})

const AnalysisOutputSchema = z.object({
  flip_score: FlipScoreSchema,
  red_flags: z.array(RedFlagSchema),
  growth_opportunities: z.array(GrowthOpportunitySchema),
  summary: z.string(),
  investment_thesis: z.string(),
  valuation: z.object({
    fair_value_min: z.number(),
    fair_value_max: z.number(),
    multiple_analysis: z.string(),
    recommendation: z.string(),
  }),
  listing_type: z.string(),
  niche: z.string(),
  flip_plan: FlipPlanSchema.optional(),
  roi_scenarios: z.object({
    conservative: ROIScenarioSchema,
    base: ROIScenarioSchema,
    optimistic: ROIScenarioSchema,
  }).optional(),
  negotiation: NegotiationSchema.optional(),
})

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are FlipFlow's AI analyst — an expert in digital business acquisition and flipping.
You analyze Flippa listings with the precision of a buyer who has completed 200+ acquisitions worth $50M+.

Your analysis must be:
- Brutally honest about red flags with zero sugarcoating
- Hyper-specific about growth tactics (not "add SEO" — "target [specific keyword cluster] using [specific tactic]")
- Grounded in real exit multiples: SaaS 3-5x ARR, content sites 30-42x monthly profit, eComm 2-4x annual profit, SaaS tools 4-6x ARR, newsletters 24-36x monthly profit, marketplaces 3-5x ARR
- Decisive and opinionated — buyers need conviction, not hedging

FlipScore dimensions (0-100 each):
- overall: Weighted composite. 80+ = Strong Buy, 65-79 = Consider, 50-64 = Risky, <50 = Pass
- financials: Revenue quality, consistency, recurring vs one-time, profit margins, growth trajectory
- traffic: Source diversity, organic %, trend direction, concentration risk, defensibility
- risk: 80 = very low risk, 20 = very high risk. Weight: owner dependency, platform risk, revenue volatility, legal/IP
- growth: Untapped opportunities, market ceiling, current optimization level, competitive moat
- operations: Transfer ease, tech complexity, time-to-operate, documentation quality, team needs

REQUIRED: Include a 12-month flip plan with concrete milestones. Include ROI projections for 3 target scenarios. Include negotiation leverage points to get a better price.

You MUST respond with valid JSON ONLY — no markdown, no preamble, no backticks. Match this exact schema:
{
  "flip_score": {
    "overall": 0-100,
    "financials": 0-100,
    "traffic": 0-100,
    "risk": 0-100,
    "growth": 0-100,
    "operations": 0-100
  },
  "red_flags": [
    { "severity": "high|medium|low", "title": "Short title", "description": "Detailed explanation" }
  ],
  "growth_opportunities": [
    { "impact": "high|medium|low", "title": "Short title", "description": "Specific tactic", "effort": "Low|Medium|High" }
  ],
  "summary": "2-3 sentence executive summary of this deal",
  "investment_thesis": "3-4 sentences on why you would or wouldn't buy this. Be specific about what makes this worth acquiring or not.",
  "valuation": {
    "fair_value_min": number,
    "fair_value_max": number,
    "multiple_analysis": "Explain the multiple vs market comps",
    "recommendation": "Specific pricing advice and negotiation angle"
  },
  "listing_type": "website|saas|ecommerce|app|content|other",
  "niche": "e.g. personal finance, B2B SaaS, fitness, etc.",
  "flip_plan": {
    "months_1_3": "Specific actions in first 90 days. What to fix, optimize, or launch immediately.",
    "months_4_6": "Mid-term growth moves. New channels, product improvements, partnerships.",
    "months_7_12": "Scale phase. What to build toward exit. How to maximize sale price.",
    "target_exit_multiple": 3.5,
    "key_value_drivers": ["specific lever 1", "specific lever 2", "specific lever 3"]
  },
  "roi_scenarios": {
    "conservative": {
      "label": "Conservative",
      "exit_value": 100000,
      "roi_percent": 20,
      "timeline_months": 18,
      "assumptions": "What must be true for this scenario"
    },
    "base": {
      "label": "Base Case",
      "exit_value": 150000,
      "roi_percent": 50,
      "timeline_months": 12,
      "assumptions": "What must be true for this scenario"
    },
    "optimistic": {
      "label": "Optimistic",
      "exit_value": 200000,
      "roi_percent": 100,
      "timeline_months": 12,
      "assumptions": "What must be true for this scenario"
    }
  },
  "negotiation": {
    "target_price": 100000,
    "walk_away_price": 120000,
    "leverage_points": ["specific weakness to cite", "comparable sale reference", "risk factor to negotiate on"],
    "due_diligence_questions": ["critical question 1", "critical question 2", "critical question 3"]
  }
}`

function buildPrompt(listing: FlippaListing): string {
  const monthly_profit = listing.monthly_profit || 0
  const multiple = monthly_profit > 0
    ? `${(listing.asking_price / monthly_profit).toFixed(1)}x monthly profit`
    : 'unknown multiple'
  const annualRevenue = listing.annual_revenue || listing.monthly_revenue * 12
  const monetizationStr = Array.isArray(listing.monetization)
    ? listing.monetization.join(', ')
    : (listing.monetization || 'Unknown')

  return `Analyze this Flippa listing:

TITLE: ${listing.title}
URL: ${listing.url}
ASKING PRICE: $${listing.asking_price.toLocaleString()}
MONTHLY REVENUE: $${listing.monthly_revenue.toLocaleString()}
MONTHLY PROFIT: $${monthly_profit.toLocaleString()}
ANNUAL REVENUE: $${annualRevenue.toLocaleString()}
ASKING MULTIPLE: ${multiple}
BUSINESS AGE: ${listing.age_months} months
MONETIZATION: ${monetizationStr}

DESCRIPTION:
${(listing.description || '').slice(0, 1500)}

Provide a thorough FlipFlow analysis. Be specific, honest, and decisive.`
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export async function analyzeListingWithAI(listing: FlippaListing): Promise<AnalysisOutput> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(listing) }],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonText = rawText.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const rawParsed = JSON.parse(jsonText)
    return AnalysisOutputSchema.parse(rawParsed)
  } catch (e) {
    console.error('AI parse error:', e, '\nRaw:', rawText.slice(0, 500))
    throw new Error('AI returned invalid analysis format. Please try again.')
  }
}

// ─── Quick Score (for Scout Agent) ───────────────────────────────────────────

export async function quickScoreListing(listing: FlippaListing): Promise<number> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'You are a digital business acquisition expert. Return ONLY a JSON object with one field: {"score": 0-100} where 100 = exceptional deal. No other text.',
      messages: [{
        role: 'user',
        content: `Score this Flippa listing (0-100): ${listing.title} | Price: $${listing.asking_price.toLocaleString()} | Monthly profit: $${listing.monthly_profit.toLocaleString()} | Age: ${listing.age_months}mo`
      }]
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json?|```/g, '').trim())
    return Math.min(100, Math.max(0, parsed.score || 50))
  } catch {
    return 50
  }
}
