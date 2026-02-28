'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Analysis, Profile } from '@/types'

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    score >= 65 ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
    score >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}
    </span>
  )
}

function formatCurrency(n: number) {
  if (!n) return '$—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function ComparePanel({ selected, analyses, onClose }: { selected: string[]; analyses: Analysis[]; onClose: () => void }) {
  const deals = analyses.filter(a => selected.includes(a.id))
  if (deals.length < 2) return null

  const sc = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 65 ? 'text-blue-400' : s >= 50 ? 'text-amber-400' : 'text-red-400'
  const cols = deals.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-xl overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">Deal Comparison</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-4 py-2 border border-gray-700 rounded-xl transition-colors">
            Close ✕
          </button>
        </div>
        <div className={`grid gap-4 ${cols}`}>
          {deals.map(deal => (
            <div key={deal.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-white font-semibold text-sm">{deal.listing_title}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{(deal as any).listing_type || 'Website'}</p>
              </div>
              <div className="text-center py-2">
                <p className={`text-5xl font-black ${sc(deal.flip_score ?? 0)}`}>{deal.flip_score ?? '—'}</p>
                <p className="text-gray-500 text-xs mt-1">FlipScore™</p>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Asking', value: formatCurrency((deal as any).asking_price) },
                  { label: 'Mo. Profit', value: formatCurrency((deal as any).monthly_profit) },
                  { label: 'Multiple', value: `${((deal as any).asking_price / (((deal as any).monthly_profit || 1) * 12)).toFixed(1)}x` },
                ].map(m => (
                  <div key={m.label} className="flex justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="text-gray-500 text-xs">{m.label}</span>
                    <span className="text-white text-sm font-semibold">{m.value}</span>
                  </div>
                ))}
              </div>
              {deal.score_breakdown && (
                <div className="space-y-1.5">
                  {Object.entries(deal.score_breakdown as Record<string, number>).filter(([k]) => k !== 'overall').map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-500 capitalize">{key}</span>
                        <span className={sc(val)}>{val}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full">
                        <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: val >= 80 ? '#10b981' : val >= 65 ? '#60a5fa' : val >= 50 ? '#f59e0b' : '#ef4444' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analyses' | 'scout'>('analyses')
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: profileData }, { data: analysesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      ])
      setProfile(profileData)
      setAnalyses(analysesData || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleShare(analysisId: string) {
    setSharingId(analysisId)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId })
      })
      const data = await res.json()
      if (data.token) {
        const url = `${window.location.origin}/report/${data.token}`
        setShareLinks(prev => ({ ...prev, [analysisId]: url }))
        await navigator.clipboard.writeText(url).catch(() => {})
      }
    } finally {
      setSharingId(null)
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
          Loading your workspace...
        </div>
      </div>
    )
  }

  const tier = profile?.subscription_tier || 'free'
  const used = (profile as any)?.analyses_used_this_month ?? 0
  const limit = tier === 'free' ? 3 : tier === 'starter' ? 25 : tier === 'pro' ? 100 : 9999
  const avgScore = analyses.length ? Math.round(analyses.reduce((s, a) => s + (a.flip_score ?? 0), 0) / analyses.length) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {compareOpen && <ComparePanel selected={selected} analyses={analyses} onClose={() => setCompareOpen(false)} />}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-xs font-black">F</div>
              <span className="font-bold text-white">FlipFlow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {['analyses', 'scout'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === t ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t === 'scout' ? '🤖 Scout Agent' : '📊 ' + t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/analyze" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              + New Analysis
            </Link>
            <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {activeTab === 'analyses' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Analyses This Month', value: `${used}/${limit === 9999 ? '∞' : limit}` },
                { label: 'Total Deals Analyzed', value: analyses.length },
                { label: 'Avg FlipScore™', value: avgScore || '—' },
                { label: 'Plan', value: tier.charAt(0).toUpperCase() + tier.slice(1) },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{stat.label}</p>
                  <p className="text-white font-bold text-2xl">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Compare toolbar */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Deal History</h2>
              <div className="flex items-center gap-2">
                {compareMode && selected.length >= 2 && (
                  <button onClick={() => setCompareOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Compare {selected.length} Deals →
                  </button>
                )}
                <button onClick={() => { setCompareMode(!compareMode); setSelected([]) }}
                  className={`text-sm px-4 py-2 rounded-xl border transition-colors ${compareMode ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                  {compareMode ? `✓ Comparing (${selected.length}/3)` : 'Compare Deals'}
                </button>
              </div>
            </div>

            {/* Deal list */}
            <div className="space-y-3">
              {analyses.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-white font-semibold mb-2">No analyses yet</p>
                  <p className="text-gray-400 text-sm mb-5">Paste any Flippa URL to get your first FlipScore™</p>
                  <Link href="/analyze" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors inline-block">
                    Analyze Your First Deal →
                  </Link>
                </div>
              ) : analyses.map(analysis => (
                <div key={analysis.id}
                  onClick={compareMode ? () => toggleSelect(analysis.id) : undefined}
                  className={`bg-gray-900 border rounded-xl p-4 transition-all ${
                    compareMode ? 'cursor-pointer hover:border-indigo-500/50' : ''
                  } ${selected.includes(analysis.id) ? 'border-indigo-500 bg-indigo-950/20' : 'border-gray-800'}`}>
                  <div className="flex items-center gap-4">
                    {compareMode && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected.includes(analysis.id) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                      }`}>
                        {selected.includes(analysis.id) && <span className="text-white text-xs">✓</span>}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-medium text-sm truncate">{analysis.listing_title || '(Untitled)'}</h3>
                            <ScoreBadge score={analysis.flip_score ?? 0} />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-gray-500 text-xs">{timeAgo(analysis.created_at)}</span>
                            {(analysis as any).asking_price && (
                              <span className="text-gray-500 text-xs">{formatCurrency((analysis as any).asking_price)}</span>
                            )}
                            {(analysis as any).monthly_profit && (
                              <span className="text-gray-500 text-xs">{formatCurrency((analysis as any).monthly_profit)}/mo profit</span>
                            )}
                            <span className="text-gray-600 text-xs capitalize">{(analysis as any).listing_type || ''}</span>
                          </div>
                        </div>
                        {!compareMode && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleShare(analysis.id)}
                              disabled={sharingId === analysis.id}
                              className="text-gray-500 hover:text-indigo-400 text-xs px-2.5 py-1.5 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
                              title={shareLinks[analysis.id] ? 'Link copied!' : 'Share report'}
                            >
                              {sharingId === analysis.id ? '...' : shareLinks[analysis.id] ? '✓ Copied' : '↗ Share'}
                            </button>
                            <a href={analysis.flippa_url} target="_blank" rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-300 text-xs px-2.5 py-1.5 border border-gray-700 rounded-lg transition-colors">
                              Flippa ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'scout' && (
          <div className="space-y-5">
            {tier === 'free' || tier === 'starter' ? (
              <div className="bg-gray-900 border border-indigo-500/20 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-white font-bold text-xl mb-2">Scout Agent</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">Upgrade to Pro to enable 24/7 automated Flippa monitoring. Get email alerts when high-scoring deals match your criteria.</p>
                <Link href="/pricing" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors inline-block">
                  Upgrade to Pro →
                </Link>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Configure Scout Agent</h3>
                <p className="text-gray-400 text-sm">Scout configuration UI coming soon. Scout is actively running with default settings.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
