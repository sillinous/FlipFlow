'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`
  return `$${n}`
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-400', stroke: '#10b981', label: 'Strong Buy' }
  if (score >= 65) return { text: 'text-blue-400', stroke: '#60a5fa', label: 'Consider' }
  if (score >= 50) return { text: 'text-amber-400', stroke: '#f59e0b', label: 'Risky' }
  return { text: 'text-red-400', stroke: '#ef4444', label: 'Pass' }
}

export default function SharedReportClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('t')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    fetch(`/.netlify/functions/share?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setNotFound(true); else setData(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
      <div>
        <p className="text-4xl mb-3">🔍</p>
        <h1 className="text-white font-bold text-xl mb-2">Report not found</h1>
        <p className="text-gray-400 mb-6">This link may have expired or been deleted.</p>
        <Link href="/analyze" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors">
          Analyze a listing →
        </Link>
      </div>
    </div>
  )

  const { listing, analysis } = data.analysis
  const cfg = getScoreColor(analysis.flip_score)
  const r = 52, circ = 2 * Math.PI * r

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold">FlipFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs hidden sm:block">Shared Analysis Report</span>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
            Try Free
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-indigo-400 text-sm">📊</span>
          <span className="text-gray-400 text-sm">Shared FlipFlow analysis · Expires {new Date(data.expires_at).toLocaleDateString()}</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="9"/>
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round" stroke={cfg.stroke} strokeDasharray={`${(analysis.flip_score/100)*circ} ${circ}`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${cfg.text}`}>{analysis.flip_score}</span>
                <span className={`text-[10px] font-bold uppercase ${cfg.text} opacity-80`}>{cfg.label}</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-white font-bold text-lg mb-1">{listing.title}</h1>
              <p className="text-gray-500 text-sm mb-3 capitalize">{listing.listing_type} · {listing.niche}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Asking', value: formatCurrency(listing.asking_price) },
                  { label: 'Mo. Profit', value: formatCurrency(listing.monthly_profit) },
                  { label: 'Multiple', value: `${(listing.asking_price/(listing.monthly_profit*12)).toFixed(1)}x` },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800/60 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-[10px]">{m.label}</p>
                    <p className="text-white font-bold text-sm">{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm">{analysis.summary}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-3">Investment Thesis</h2>
          <p className="text-gray-300 leading-relaxed text-sm">{analysis.investment_thesis}</p>
        </div>

        {analysis.red_flags?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-3">Red Flags ({analysis.red_flags.length})</h2>
            <div className="space-y-2">
              {analysis.red_flags.slice(0,3).map((f: any, i: number) => (
                <div key={i} className={`border rounded-xl p-3 ${f.severity === 'high' ? 'border-red-500/30 bg-red-950/20' : f.severity === 'medium' ? 'border-amber-500/30 bg-amber-950/20' : 'border-gray-700 bg-gray-800/30'}`}>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border border-indigo-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Analyze your own Flippa deals</h3>
          <p className="text-gray-400 text-sm mb-5">FlipScore™ · Red flags · ROI model · 12-month flip plan</p>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block">
            Start Free — 3 analyses/month
          </Link>
        </div>
      </div>
    </div>
  )
}
