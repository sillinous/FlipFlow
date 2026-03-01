'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function fmt(n: number) {
  if (!n) return '$—'
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`
  return `$${n}`
}

function sc(s: number) {
  return s >= 80 ? '#10b981' : s >= 65 ? '#60a5fa' : s >= 50 ? '#f59e0b' : '#ef4444'
}

function label(s: number) {
  return s >= 80 ? 'Strong Buy' : s >= 65 ? 'Consider' : s >= 50 ? 'Risky' : 'Pass'
}

export default function SharedReportClient({ token }: { token: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/share?token=${token}`)
      .then(r => r.json())
      .then(d => d.error ? setNotFound(true) : setData(d))
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
  const color = sc(analysis.flip_score)
  const r = 52; const circ = 2 * Math.PI * r

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold">FlipFlow</span>
        </Link>
        <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
          Try FlipFlow Free
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl px-4 py-3 text-gray-400 text-sm">
          📊 Shared FlipFlow analysis · Expires {new Date(data.expires_at).toLocaleDateString()}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="9"/>
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
                  stroke={color} strokeDasharray={`${(analysis.flip_score/100)*circ} ${circ}`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color }}>{analysis.flip_score}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80" style={{ color }}>{label(analysis.flip_score)}</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-white font-bold text-xl mb-1">{listing.title}</h1>
              <p className="text-gray-500 text-sm mb-3 capitalize">{listing.listing_type} · {listing.niche}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Ask', value: fmt(listing.asking_price) },
                  { label: 'Mo. Profit', value: fmt(listing.monthly_profit) },
                  { label: 'Multiple', value: `${(listing.asking_price / ((listing.monthly_profit || 1) * 12)).toFixed(1)}x` },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800/60 rounded-lg p-2.5 text-center">
                    <p className="text-gray-500 text-[10px]">{m.label}</p>
                    <p className="text-white font-bold text-sm">{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm">{analysis.summary}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Investment Thesis</h2>
          <p className="text-gray-300 leading-relaxed">{analysis.investment_thesis}</p>
        </div>

        {analysis.red_flags?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-4">Red Flags ({analysis.red_flags.length})</h2>
            <div className="space-y-3">
              {analysis.red_flags.slice(0,3).map((f: any, i: number) => (
                <div key={i} className={`border rounded-xl p-4 ${f.severity === 'high' ? 'border-red-500/30 bg-red-950/20' : f.severity === 'medium' ? 'border-amber-500/30 bg-amber-950/20' : 'border-gray-700 bg-gray-800/30'}`}>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border border-indigo-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Analyze your own Flippa deals</h3>
          <p className="text-gray-400 text-sm mb-5">FlipScore™, red flags, ROI model, 12-month flip plan — free to try</p>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-block">
            Start Free →
          </Link>
        </div>
      </div>
    </div>
  )
}
