'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

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
    description: string
  }
  analysis: {
    flip_score: number
    score_breakdown: { financials: number; traffic: number; risk: number; growth: number; operations: number }
    red_flags: Array<{ severity: 'low'|'medium'|'high'; title: string; description: string }>
    growth_opportunities: Array<{ impact: 'low'|'medium'|'high'; title: string; description: string; effort: string }>
    valuation: { fair_value_min: number; fair_value_max: number; multiple_analysis: string; recommendation: string }
    summary: string
    investment_thesis: string
    flip_plan: FlipPlan | null
    roi_scenarios: { conservative: ROIScenario; base: ROIScenario; optimistic: ROIScenario } | null
    negotiation: Negotiation | null
  }
  is_guest?: boolean
  gated?: { flip_plan?: boolean; roi_scenarios?: boolean; negotiation?: boolean }
  analysis_id?: string
  quota_remaining?: number
}

type Tab = 'overview' | 'flags' | 'opportunities' | 'plan' | 'roi' | 'negotiate' | 'valuation'

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`
  return `$${n}`
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-400', stroke: '#10b981', label: 'Strong Buy', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  if (score >= 65) return { text: 'text-blue-400', stroke: '#60a5fa', label: 'Consider', bg: 'bg-blue-500/10 border-blue-500/20' }
  if (score >= 50) return { text: 'text-amber-400', stroke: '#f59e0b', label: 'Risky', bg: 'bg-amber-500/10 border-amber-500/20' }
  return { text: 'text-red-400', stroke: '#ef4444', label: 'Pass', bg: 'bg-red-500/10 border-red-500/20' }
}

function ScoreRing({ score }: { score: number }) {
  const cfg = getScoreColor(score)
  const r = 52; const circ = 2 * Math.PI * r
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="9"/>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={cfg.stroke}
          strokeDasharray={`${(score/100)*circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${cfg.text} tabular-nums`}>{score}</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${cfg.text} opacity-80`}>{cfg.label}</span>
      </div>
    </div>
  )
}

function GatedOverlay({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 backdrop-blur-sm bg-gray-950/60 rounded-2xl flex flex-col items-center justify-center gap-3 border border-indigo-500/20">
        <div className="text-2xl">🔒</div>
        <p className="text-white font-semibold text-center">{feature}</p>
        <p className="text-gray-400 text-sm text-center max-w-xs">Upgrade to Starter to unlock full analysis</p>
        <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          Sign Up Free →
        </Link>
      </div>
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none opacity-40">
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 h-20"/>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingSteps() {
  const steps = ['Fetching listing data', 'Processing financials', 'Detecting red flags', 'Building flip plan', 'Calculating FlipScore™']
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % steps.length), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"/>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"/>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Analyzing deal...</p>
          <p className="text-indigo-400 text-sm mt-2 h-5 transition-all">{steps[active]}</p>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= active ? 'bg-indigo-500 w-6' : 'bg-gray-700 w-3'}`}/>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [guestToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    let t = localStorage.getItem('ff_guest_token')
    if (!t) { t = crypto.randomUUID(); localStorage.setItem('ff_guest_token', t) }
    return t
  })

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!url.includes('flippa.com')) { setError('Please enter a valid Flippa listing URL'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await (await import('@/lib/api')).apiFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, guest_token: guestToken })
      })
      const data = await res.json()
      if (data.guest_limit_reached) {
        setError('You\'ve used your free analysis. Sign up to get 3 analyses per month, free.')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setActiveTab('overview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const sev = {
    high: { card: 'border-red-500/30 bg-red-950/20', badge: 'bg-red-500/15 text-red-400 border-red-500/20' },
    medium: { card: 'border-amber-500/30 bg-amber-950/20', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    low: { card: 'border-gray-700 bg-gray-800/30', badge: 'bg-gray-700 text-gray-400 border-gray-600' },
  }

  const tabs: { id: Tab; label: string; locked?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'flags', label: `Flags (${result?.analysis.red_flags.length ?? 0})` },
    { id: 'opportunities', label: `Growth (${result?.analysis.growth_opportunities.length ?? 0})` },
    { id: 'valuation', label: 'Valuation' },
    { id: 'plan', label: '12-Mo Plan', locked: result?.gated?.flip_plan },
    { id: 'roi', label: 'ROI Model', locked: result?.gated?.roi_scenarios },
    { id: 'negotiate', label: 'Negotiate', locked: result?.gated?.negotiation },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold">FlipFlow</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">Sign up free</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FlipScore™ Analyzer</h1>
          <p className="text-gray-400">AI deal analysis in under 15 seconds. Red flags, ROI model, 12-month flip plan.</p>
        </div>

        {/* Input */}
        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔗</div>
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://flippa.com/listing/..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit" disabled={loading || !url}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Analyzing...</>
              ) : <>Analyze Deal <span className="opacity-60">→</span></>}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-sm flex-1">{error}</span>
              {error.includes('Sign up') && (
                <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold whitespace-nowrap">Sign up free →</Link>
              )}
            </div>
          )}
          <p className="text-gray-600 text-xs mt-2.5 text-center">No account needed for first analysis · 3 free/month with signup</p>
        </form>

        {loading && <LoadingSteps />}

        {result && (
          <div className="space-y-5">
            {/* Guest banner */}
            {result.is_guest && (
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-sm">Get 3 free analyses/month</p>
                  <p className="text-gray-400 text-xs mt-0.5">Flip plan, ROI model & negotiation guide unlock with free account</p>
                </div>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap flex-shrink-0">
                  Sign up free
                </Link>
              </div>
            )}

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
                      className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 flex-shrink-0 mt-0.5">
                      Flippa ↗
                    </a>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: 'Ask', value: formatCurrency(result.listing.asking_price) },
                      { label: 'Mo. Profit', value: formatCurrency(result.listing.monthly_profit) },
                      { label: 'Ann. Rev', value: formatCurrency(result.listing.annual_revenue) },
                      { label: 'Multiple', value: `${(result.listing.asking_price / (result.listing.monthly_profit * 12)).toFixed(1)}x` },
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

              {/* Score breakdown */}
              <div className="mt-5 pt-5 border-t border-gray-800">
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(result.analysis.score_breakdown).map(([key, val]) => {
                    const cfg = getScoreColor(val as number)
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-500 text-[10px] capitalize">{key}</span>
                          <span className={`text-xs font-bold ${cfg.text}`}>{val}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${val}%`, backgroundColor: cfg.stroke }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 flex gap-0.5 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {tab.locked && <span className="text-[10px]">🔒</span>}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'overview' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wide text-gray-400">Investment Thesis</h3>
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

              {activeTab === 'flags' && (
                <div className="space-y-3">
                  {result.analysis.red_flags.length === 0 ? (
                    <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-8 text-center">
                      <span className="text-3xl">✅</span>
                      <p className="text-emerald-400 font-semibold mt-3">No significant red flags detected</p>
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

              {activeTab === 'opportunities' && (
                <div className="space-y-3">
                  {result.analysis.growth_opportunities.map((opp, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${
                      opp.impact === 'high' ? 'border-emerald-500/30 bg-emerald-950/20' :
                      opp.impact === 'medium' ? 'border-blue-500/30 bg-blue-950/20' :
                      'border-gray-700 bg-gray-800/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${
                          opp.impact === 'high' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                          opp.impact === 'medium' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                          'bg-gray-700 text-gray-400 border-gray-600'
                        }`}>
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

              {activeTab === 'valuation' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-xs mb-1">Fair Value Range</p>
                      <p className="text-white font-bold text-xl">
                        {formatCurrency(result.analysis.valuation.fair_value_min)} – {formatCurrency(result.analysis.valuation.fair_value_max)}
                      </p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center">
                      <p className="text-gray-500 text-xs mb-1">Asking Price</p>
                      <p className={`font-bold text-xl ${
                        result.listing.asking_price <= result.analysis.valuation.fair_value_max ? 'text-emerald-400' : 'text-red-400'
                      }`}>{formatCurrency(result.listing.asking_price)}</p>
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

              {activeTab === 'plan' && (
                result.gated?.flip_plan ? (
                  <GatedOverlay feature="12-Month Flip Plan" onUpgrade={() => {}} />
                ) : result.analysis.flip_plan ? (
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
                          { label: 'Months 1–3', title: 'Foundation', content: result.analysis.flip_plan.months_1_3, color: 'border-blue-500/40 bg-blue-950/20', dot: 'bg-blue-500' },
                          { label: 'Months 4–6', title: 'Growth', content: result.analysis.flip_plan.months_4_6, color: 'border-emerald-500/40 bg-emerald-950/20', dot: 'bg-emerald-500' },
                          { label: 'Months 7–12', title: 'Scale & Exit', content: result.analysis.flip_plan.months_7_12, color: 'border-violet-500/40 bg-violet-950/20', dot: 'bg-violet-500' },
                        ].map(phase => (
                          <div key={phase.label} className={`border rounded-xl p-4 ${phase.color}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${phase.dot}`}/>
                              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{phase.label} — {phase.title}</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{phase.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Key Value Drivers</p>
                      <div className="grid grid-cols-1 gap-2">
                        {result.analysis.flip_plan.key_value_drivers.map((d, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                            <span className="text-indigo-400 font-bold text-sm flex-shrink-0">0{i+1}</span>
                            <p className="text-gray-300 text-sm">{d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-10">Flip plan not available for this analysis</p>
              )}

              {activeTab === 'roi' && (
                result.gated?.roi_scenarios ? (
                  <GatedOverlay feature="ROI Projection Model" onUpgrade={() => {}} />
                ) : result.analysis.roi_scenarios ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {Object.values(result.analysis.roi_scenarios).map((scenario, i) => {
                        const colors = ['text-blue-400 border-blue-500/30 bg-blue-950/20', 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20', 'text-violet-400 border-violet-500/30 bg-violet-950/20']
                        return (
                          <div key={i} className={`border rounded-2xl p-4 ${colors[i]}`}>
                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-3">{scenario.label}</p>
                            <p className="text-2xl font-black mb-0.5">{formatCurrency(scenario.exit_value)}</p>
                            <p className="text-sm font-bold opacity-80">+{scenario.roi_percent}% ROI</p>
                            <p className="text-xs opacity-50 mt-1">{scenario.timeline_months} months</p>
                            <div className="mt-3 pt-3 border-t border-current/10">
                              <p className="text-xs opacity-60 leading-relaxed">{scenario.assumptions}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">
                        💡 ROI projections assume acquisition at asking price. Negotiating to target price improves all scenarios.
                        Conservative scenario assumes no growth; base assumes moderate execution; optimistic assumes strong execution on all identified growth levers.
                      </p>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-10">ROI model not available for this analysis</p>
              )}

              {activeTab === 'negotiate' && (
                result.gated?.negotiation ? (
                  <GatedOverlay feature="Negotiation Intelligence" onUpgrade={() => {}} />
                ) : result.analysis.negotiation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <p className="text-gray-500 text-xs mb-1">Target Offer</p>
                        <p className="text-emerald-400 font-black text-2xl">{formatCurrency(result.analysis.negotiation.target_price)}</p>
                        <p className="text-gray-500 text-[10px] mt-1">Start here</p>
                      </div>
                      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 text-center">
                        <p className="text-gray-500 text-xs mb-1">Walk Away At</p>
                        <p className="text-red-400 font-black text-2xl">{formatCurrency(result.analysis.negotiation.walk_away_price)}</p>
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
                            <span className="text-indigo-400 font-bold text-xs mt-0.5 flex-shrink-0">Q{i+1}</span>
                            <p className="text-gray-300 text-sm">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-gray-500 text-center py-10">Negotiation guide not available for this analysis</p>
              )}
            </div>

            {/* Bottom CTA */}
            {(result.is_guest || result.gated?.flip_plan) && (
              <div className="bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-bold">Unlock the full analysis</p>
                    <p className="text-gray-400 text-sm mt-0.5">Flip plan · ROI model · Negotiation guide · 3 analyses/month free</p>
                  </div>
                  <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    Create Free Account →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
