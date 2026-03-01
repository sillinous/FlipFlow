import { z } from 'zod'
import type { FlippaListing } from './flippa'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

async function groqChat(
  model: string,
  messages: Array<{role: string; content: string}>,
  opts: { temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 4096,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Groq API ${res.status}: ${await res.text()}`)
  const data = await res.json() as any
  return data.choices[0]?.message?.content || '{}'
}


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
- Hyper-specific about growth tactics (not "add SEO" — name specific keyword clusters, specific tactics)
- Grounded in real exit multiples: SaaS 3-5x ARR, content sites 30-42x monthly profit, eComm 2-4x annual profit, newsletters 24-36x monthly profit
- Decisive and opinionated — buyers need conviction, not hedging

FlipScore dimensions (0-100 each):
- overall: Weighted composite. 80+ = Strong Buy, 65-79 = Consider, 50-64 = Risky, <50 = Pass
- financials: Revenue quality, consistency, recurring vs one-time, profit margins, growth trajectory
- traffic: Source diversity, organic %, trend direction, concentration risk, defensibility
- risk: 80 = very low risk, 20 = very high risk. Weight: owner dependency, platform risk, revenue volatility
- growth: Untapped opportunities, market ceiling, current optimization level
- operations: Transfer ease, tech complexity, time-to-operate, documentation quality

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no backticks, no explanation. Start your response with { and end with }.

Respond with exactly this JSON structure:
{
  "flip_score": {
    "overall": <0-100>,
    "financials": <0-100>,
    "traffic": <0-100>,
    "risk": <0-100>,
    "growth": <0-100>,
    "operations": <0-100>
  },
  "red_flags": [
    { "severity": "high|medium|low", "title": "...", "description": "..." }
  ],
  "growth_opportunities": [
    { "impact": "high|medium|low", "title": "...", "description": "...", "effort": "Low|Medium|High" }
  ],
  "summary": "2-3 sentence executive summary",
  "investment_thesis": "3-4 sentences on why you would or would not buy this",
  "valuation": {
    "fair_value_min": <number>,
    "fair_value_max": <number>,
    "multiple_analysis": "explain the multiple vs market comps",
    "recommendation": "specific pricing and negotiation advice"
  },
  "listing_type": "website|saas|ecommerce|app|content|other",
  "niche": "e.g. personal finance, B2B SaaS, fitness",
  "flip_plan": {
    "months_1_3": "specific actions in first 90 days",
    "months_4_6": "mid-term growth moves",
    "months_7_12": "scale phase and exit prep",
    "target_exit_multiple": <number>,
    "key_value_drivers": ["driver 1", "driver 2", "driver 3"]
  },
  "roi_scenarios": {
    "conservative": { "label": "Conservative", "exit_value": <number>, "roi_percent": <number>, "timeline_months": 18, "assumptions": "..." },
    "base": { "label": "Base Case", "exit_value": <number>, "roi_percent": <number>, "timeline_months": 12, "assumptions": "..." },
    "optimistic": { "label": "Optimistic", "exit_value": <number>, "roi_percent": <number>, "timeline_months": 12, "assumptions": "..." }
  },
  "negotiation": {
    "target_price": <number>,
    "walk_away_price": <number>,
    "leverage_points": ["point 1", "point 2", "point 3"],
    "due_diligence_questions": ["question 1", "question 2", "question 3"]
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

  return `Analyze this Flippa listing and respond with ONLY a JSON object:

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
${(listing.description || '').slice(0, 2000)}

Return ONLY valid JSON. No markdown, no backticks, no text before or after the JSON.`
}

// ─── Main Analysis ────────────────────────────────────────────────────────────

export async function analyzeListingWithAI(listing: FlippaListing): Promise<AnalysisOutput> {
  const raw = await groqChat(
    'llama-3.3-70b-versatile',
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(listing) },
    ],
    { temperature: 0.3, max_tokens: 4096 }
  )

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Try to extract JSON if there's surrounding text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned invalid JSON')
    parsed = JSON.parse(match[0])
  }

  const result = AnalysisOutputSchema.safeParse(parsed)
  if (!result.success) {
    console.error('Schema validation failed:', result.error.issues.slice(0, 3))
    // Return with graceful fallback for optional fields
    return parsed as AnalysisOutput
  }

  return result.data
}

// ─── Quick Score (for Scout) ──────────────────────────────────────────────────

export async function quickScoreListing(listing: FlippaListing): Promise<number> {
  const raw = await groqChat(
    'llama-3.1-8b-instant',
    [
      { role: 'system', content: 'You are a digital business acquisition expert. Score listings 0-100. Respond ONLY with JSON: {"score": <number>}' },
      { role: 'user', content: `Score this Flippa listing:\nTitle: ${listing.title}\nAsking: $${listing.asking_price.toLocaleString()}\nMonthly Profit: $${(listing.monthly_profit || 0).toLocaleString()}\nReturn ONLY: {"score": <number>}` },
    ],
    { temperature: 0.1, max_tokens: 50 }
  )

  const raw = completion.choices[0]?.message?.content || '{"score": 50}'
  try {
    const parsed = JSON.parse(raw)
    return Math.min(100, Math.max(0, Number(parsed.score) || 50))
  } catch {
    return 50
  }
}
