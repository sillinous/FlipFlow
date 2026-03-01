'use client'

import { useState } from 'react'

interface FlipPlan {
  months_1_3: string
  months_4_6: string
  months_7_12: string
  target_exit_multiple: number
  key_value_drivers: string[]
}

interface ROIScenario {
  label: string
  exit_value: number
  roi_percent: number
  timeline_months: number
  assumptions: string
}

interface Negotiation {
  target_price: number
  walk_away_price: number
  leverage_points: string[]
  due_diligence_questions: string[]
}

interface AnalysisResult {
  listing: {
    title: string
    url: string
    asking_price: number
    monthly_profit: number
    monthly_revenue: number
    annual_revenue: number
    listing_type: string
    age_months: number
    monetization: string[]
    niche: string
  }
  analysis: {
    flip_score: number
    score_breakdown: { financials: number; traffic: number; risk: number; growth: number; operations: number }
    red_flags: Array<{ severity: 'low' | 'medium' | 'high'; title: string; description: string }>
    growth_opportunities: Array<{ impact: 'low' | 'medium' | 'high'; title: string; description: string; effort: string }>
    valuation: { fair_value_min: number; fair_value_max: number; multiple_analysis: string; recommendation: string }
    summary: string
    investment_thesis: string
    flip_plan: FlipPlan | null
    roi_scenarios: { conservative: ROIScenario; base: ROIScenario; optimistic: ROIScenario } | null
    negotiation: Negotiation | null
  }
}

type Tab = 'overview' | 'flags' | 'opportunities' | 'valuation' | 'plan' | 'roi' | 'negotiate'

function fmt(n: number) {
  if (!n) return '$—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function scoreColor(s: number) {
  if (s >= 80) return { text: 'text-emerald-400', stroke: '#10b981', label: 'Strong Buy', ring: 'bg-emerald-500/10 border-emerald-500/30' }
  if (s >= 65) return { text: 'text-blue-400', stroke: '#60a5fa', label: 'Consider', ring: 'bg-blue-500/10 border-blue-500/30' }
  if (s >= 50) return { text: 'text-amber-400', stroke: '#f59e0b', label: 'Risky', ring: 'bg-amber-500/10 border-amber-500/30' }
  return { text: 'text-red-400', stroke: '#ef4444', label: 'Pass', ring: 'bg-red-500/10 border-red-500/30' }
}

function ScoreRing({ score }: { score: number }) {
  const cfg = scoreColor(score)
  const r = 52, circ = 2 * Math.PI * r
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={cfg.stroke} strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black tabular-nums ${cfg.text}`}>{score}</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase opacity-80 ${cfg.text}`}>{cfg.label}</span>
      </div>
    </div>
  )
}

function LoadingPulse() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🔍</div>
        </div>
        <div>
          <p className="text-white font-semibold text-lg mb-1">Analyzing listing...</p>
          <p className="text-gray-500 text-sm">Fetching data · Running AI analysis · Building flip plan</p>
        </div>
      </div>
    </div>
  )
}

export default function AnalyzeClient() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setTab('overview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const sev = {
    high: { card: 'border-red-500/30 bg-red-950/20', badge: 'bg-red-500/15 text-red-400 border-red-500/20' },
    medium: { card: 'border-amber-500/30 bg-amber-950/20', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    low: { card: 'border-gray-700 bg-gray-800/30', badge: 'bg-gray-700/50 text-gray-400 border-gray-600' },
  }
  const imp = {
    high: { card: 'border-emerald-500/30 bg-emerald-950/20', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    medium: { card: 'border-blue-500/30 bg-blue-950/20', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    low: { card: 'border-gray-700 bg-gray-800/30', badge: 'bg-gray-700/50 text-gray-400 border-gray-600' },
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flags', label: `🚩 Flags${result ? ` (${result.analysis.red_flags.length})` : ''}` },
    { id: 'opportunities', label: `🚀 Growth${result ? ` (${result.analysis.growth_opportunities.length})` : ''}` },
    { id: 'valuation', label: '💰 Valuation' },
    { id: 'plan', label: '📅 Flip Plan' },
    { id: 'roi', label: '📈 ROI Model' },
    { id: 'negotiate', label: '🤝 Negotiate' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-20">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold">FlipFlow</span>
        </a>
        <span className="text-gray-500 text-sm hidden sm:block">AI Deal Analyzer — Free &amp; Unlimited</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FlipScore™ Analyzer</h1>
          <p className="text-gray-400">Paste any Flippa listing URL. Get AI-powered analysis instantly — no account needed.</p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">🔗</span>
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://flippa.com/listing/..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading || !url.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-500/20">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                : <>Analyze →</>}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {loading && <LoadingPulse />}

        {result && (
          <div className="space-y-5">
            {/* Score card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start gap-5">
                <ScoreRing score={result.analysis.flip_score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-white font-bold text-lg leading-tight">{result.listing.title}</h2>
                      <p className="text-gray-500 text-sm mt-0.5 capitalize">{result.listing.listing_type} · {result.listing.niche}</p>
                    </div>
                    <a href={result.listing.url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-xs flex-shrink-0 mt-0.5">
                      View on Flippa ↗
                    </a>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: 'Asking', value: fmt(result.listing.asking_price) },
                      { label: 'Mo. Profit', value: fmt(result.listing.monthly_profit) },
                      { label: 'Ann. Rev', value: fmt(result.listing.annual_revenue) },
                      { label: 'Multiple', value: result.listing.monthly_profit ? `${(result.listing.asking_price / (result.listing.monthly_profit * 12)).toFixed(1)}x` : '—' },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wide">{m.label}</p>
                        <p className="text-white font-bold text-sm mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{result.analysis.summary}</p>
                </div>
              </div>

              {/* Score breakdown bars */}
              <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-5 gap-3">
                {Object.entries(result.analysis.score_breakdown).map(([key, val]) => {
                  const c = scoreColor(val as number)
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 text-[10px] capitalize">{key}</span>
                        <span className={`text-xs font-bold ${c.text}`}>{val}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${val}%`, backgroundColor: c.stroke }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tab bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 flex gap-0.5 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="min-h-48">

              {tab === 'overview' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Investment Thesis</p>
                    <p className="text-gray-300 leading-relaxed">{result.analysis.investment_thesis}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Age', value: `${result.listing.age_months} months` },
                      { label: 'Monetization', value: result.listing.monetization.join(', ') || 'N/A' },
                      { label: 'Niche', value: result.listing.niche },
                      { label: 'Type', value: result.listing.listing_type },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-800/50 rounded-xl p-3">
                        <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                        <p className="text-white font-medium text-sm capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'flags' && (
                <div className="space-y-3">
                  {result.analysis.red_flags.length === 0 ? (
                    <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-10 text-center">
                      <p className="text-3xl mb-3">✅</p>
                      <p className="text-emerald-400 font-semibold">No significant red flags detected</p>
                    </div>
                  ) : result.analysis.red_flags.map((flag, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${sev[flag.severity].card}`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${sev[flag.severity].badge}`}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <div>
                          <p className="text-white font-semibold text-sm">{flag.title}</p>
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{flag.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'opportunities' && (
                <div className="space-y-3">
                  {result.analysis.growth_opportunities.map((opp, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${imp[opp.impact].card}`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${imp[opp.impact].badge}`}>
                          {opp.impact.toUpperCase()} IMPACT
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-white font-semibold text-sm">{opp.title}</p>
                            <span className="text-gray-500 text-xs">{opp.effort} effort</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1 leading-relaxed">{opp.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'valuation' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-xs mb-1">Fair Value Range</p>
                      <p className="text-white font-bold text-xl">
                        {fmt(result.analysis.valuation.fair_value_min)} – {fmt(result.analysis.valuation.fair_value_max)}
                      </p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-xs mb-1">Asking Price</p>
                      <p className={`font-bold text-xl ${result.listing.asking_price <= result.analysis.valuation.fair_value_max ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt(result.listing.asking_price)}
                      </p>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {result.listing.asking_price <= result.analysis.valuation.fair_value_min ? '✓ Under fair value' :
                          result.listing.asking_price <= result.analysis.valuation.fair_value_max ? '~ At fair value' : '⚠ Above fair value'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Multiple Analysis</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.analysis.valuation.multiple_analysis}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Recommendation</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.analysis.valuation.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'plan' && (
                result.analysis.flip_plan ? (
                  <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white font-semibold">12-Month Acquisition Roadmap</h3>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5">
                          <span className="text-indigo-400 text-sm font-semibold">{result.analysis.flip_plan.target_exit_multiple}x target exit</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Months 1–3', phase: 'Foundation', content: result.analysis.flip_plan.months_1_3, color: 'border-blue-500/40 bg-blue-950/20', dot: 'bg-blue-500' },
                          { label: 'Months 4–6', phase: 'Growth', content: result.analysis.flip_plan.months_4_6, color: 'border-emerald-500/40 bg-emerald-950/20', dot: 'bg-emerald-500' },
                          { label: 'Months 7–12', phase: 'Scale & Exit', content: result.analysis.flip_plan.months_7_12, color: 'border-violet-500/40 bg-violet-950/20', dot: 'bg-violet-500' },
                        ].map(p => (
                          <div key={p.label} className={`border rounded-xl p-4 ${p.color}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${p.dot}`} />
                              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{p.label} — {p.phase}</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{p.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Key Value Drivers</p>
                      <div className="space-y-2">
                        {result.analysis.flip_plan.key_value_drivers.map((d, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                            <span className="text-indigo-400 font-bold text-sm flex-shrink-0">0{i + 1}</span>
                            <p className="text-gray-300 text-sm">{d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-16">Flip plan unavailable for this listing</p>
              )}

              {tab === 'roi' && (
                result.analysis.roi_scenarios ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {Object.values(result.analysis.roi_scenarios).map((s, i) => {
                        const palette = [
                          'text-blue-400 border-blue-500/30 bg-blue-950/20',
                          'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
                          'text-violet-400 border-violet-500/30 bg-violet-950/20',
                        ]
                        return (
                          <div key={i} className={`border rounded-2xl p-4 ${palette[i]}`}>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-3">{s.label}</p>
                            <p className="text-2xl font-black mb-0.5">{fmt(s.exit_value)}</p>
                            <p className="text-sm font-bold opacity-80">+{s.roi_percent}% ROI</p>
                            <p className="text-xs opacity-50 mt-1">{s.timeline_months} months</p>
                            <div className="mt-3 pt-3 border-t border-current/10">
                              <p className="text-xs opacity-60 leading-relaxed">{s.assumptions}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <p className="text-gray-500 text-xs leading-relaxed">
                        💡 ROI projections assume acquisition at asking price. Negotiating down to target price improves all three scenarios. Conservative assumes no growth; base assumes moderate execution; optimistic assumes all growth levers activated.
                      </p>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-16">ROI model unavailable for this listing</p>
              )}

              {tab === 'negotiate' && (
                result.analysis.negotiation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <p className="text-gray-500 text-xs mb-1">Open With</p>
                        <p className="text-emerald-400 font-black text-2xl">{fmt(result.analysis.negotiation.target_price)}</p>
                        <p className="text-gray-500 text-[10px] mt-1">Your target offer</p>
                      </div>
                      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 text-center">
                        <p className="text-gray-500 text-xs mb-1">Walk Away At</p>
                        <p className="text-red-400 font-black text-2xl">{fmt(result.analysis.negotiation.walk_away_price)}</p>
                        <p className="text-gray-500 text-[10px] mt-1">Maximum acceptable</p>
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Leverage Points</p>
                      <div className="space-y-2.5">
                        {result.analysis.negotiation.leverage_points.map((pt, i) => (
                          <div key={i} className="flex gap-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
                            <span className="text-amber-400 text-sm">⚡</span>
                            <p className="text-gray-300 text-sm">{pt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Due Diligence Questions</p>
                      <div className="space-y-2">
                        {result.analysis.negotiation.due_diligence_questions.map((q, i) => (
                          <div key={i} className="flex gap-3 items-start bg-gray-800/50 rounded-lg p-3">
                            <span className="text-indigo-400 font-bold text-xs mt-0.5 flex-shrink-0">Q{i + 1}</span>
                            <p className="text-gray-300 text-sm">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-16">Negotiation guide unavailable for this listing</p>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
