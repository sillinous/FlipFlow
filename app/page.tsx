import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">F</div>
          <span className="font-bold text-white text-lg">FlipFlow</span>
        </div>
        <Link href="/analyze" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
          Try it free →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-400 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Free · No signup required · Unlimited analyses
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Stop guessing.<br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Start FlipScoring.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Paste any Flippa listing URL. Get an instant AI analysis — FlipScore™, red flags, growth map, ROI model, 12-month flip plan, and negotiation guide.
        </p>
        <Link href="/analyze" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors shadow-xl shadow-indigo-500/20">
          Analyze a Listing →
        </Link>
        <p className="text-gray-600 text-sm mt-4">No account · No credit card · No limits</p>
      </section>

      {/* Feature grid */}
      <section className="border-t border-white/10 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'FlipScore™', desc: 'Composite 0-100 score across financials, traffic, risk, growth, and operations.' },
              { icon: '🚩', title: 'Red Flag Detection', desc: 'AI-ranked risks with severity ratings — owner dependency, revenue volatility, platform risk.' },
              { icon: '📈', title: 'Growth Opportunities', desc: 'Specific, actionable levers the current owner is missing. What you could unlock post-acquisition.' },
              { icon: '💰', title: 'Valuation Analysis', desc: 'Fair value range vs. asking price. Multiple analysis vs. real market comps.' },
              { icon: '📅', title: '12-Month Flip Plan', desc: 'Phase-by-phase roadmap: foundation, growth, scale & exit. Key value drivers.' },
              { icon: '🤝', title: 'Negotiation Guide', desc: 'Target offer, walk-away price, leverage points, and due diligence questions.' },
            ].map(f => (
              <div key={f.title} className="bg-white/[0.03] border border-white/8 rounded-xl p-5 hover:bg-white/[0.05] transition-colors">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to analyze your first deal?</h2>
        <p className="text-gray-400 mb-8">Paste a Flippa URL and get the full picture in under 15 seconds.</p>
        <Link href="/analyze" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors">
          Analyze Now — It's Free
        </Link>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-gray-600 text-sm">
        FlipFlow — AI deal analysis for Flippa acquisitions
      </footer>
    </div>
  )
}
