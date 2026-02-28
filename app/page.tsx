import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-bold text-white text-lg">FlipFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link>
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Login</Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-400 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          AI-Powered Deal Analysis for Flippa
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Stop guessing.<br />
          <span className="gradient-text">Start FlipScoring.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Paste any Flippa listing URL. Get an instant AI analysis — FlipScore, red flags, growth opportunities, and valuation breakdown in under 10 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/analyze" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
            Analyze a Listing Free →
          </Link>
          <Link href="#how-it-works" className="glass text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
            See How It Works
          </Link>
        </div>
        <p className="text-gray-500 text-sm mt-4">No credit card required • 3 free analyses per month</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '< 10s', label: 'Analysis time' },
            { value: '40+', label: 'Data points analyzed' },
            { value: '3 free', label: 'Analyses per month' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-white text-center mb-4">How FlipFlow Works</h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">Three steps from raw listing to confident acquisition decision.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Paste the URL', desc: 'Drop any Flippa listing URL into FlipFlow. We instantly fetch all public listing data.' },
            { step: '02', title: 'AI Analyzes Everything', desc: 'Claude AI evaluates revenue quality, growth trajectory, risk factors, and flip potential across 40+ dimensions.' },
            { step: '03', title: 'Get Your FlipScore', desc: 'Receive a 0-100 FlipScore with detailed breakdown, red flags ranked by severity, and actionable growth plays.' },
          ].map((item) => (
            <div key={item.step} className="glass rounded-2xl p-6">
              <div className="text-indigo-400 font-mono text-sm font-bold mb-3">{item.step}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white/[0.02] border-y border-white/10 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-16">Everything You Need to Flip Smart</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '🎯', title: 'FlipScore™', desc: 'Composite 0-100 score combining revenue quality, growth trajectory, competition, and flip potential.' },
              { icon: '🚩', title: 'Red Flag Detection', desc: 'AI-identified risks with severity ratings — traffic concentration, revenue volatility, owner dependency, and more.' },
              { icon: '📈', title: 'Growth Opportunity Map', desc: 'Specific, actionable growth levers the current owner is missing that you could exploit post-acquisition.' },
              { icon: '💰', title: 'Valuation Analysis', desc: 'Whether the asking price is fair, and what the realistic exit multiple looks like after 12-18 months of work.' },
              { icon: '🤖', title: 'Scout Agent', desc: 'Set your criteria and let our AI monitor Flippa 24/7. Get email alerts when deals matching your filters appear.' },
              { icon: '📊', title: 'Deal History', desc: 'Full searchable archive of every listing you\'ve analyzed, with FlipScores and notes for easy comparison.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 glass rounded-xl">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-400 mb-10">Start free. Upgrade when you're ready to go serious.</p>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { name: 'Free', price: '$0', analyses: '3 analyses/mo', features: ['FlipScore', 'Red flags', 'Basic analysis'] },
            { name: 'Starter', price: '$29', analyses: '25 analyses/mo', features: ['Everything in Free', 'Growth opportunities', 'Deal history'], highlight: false },
            { name: 'Scout', price: '$99', analyses: 'Unlimited + Scout Agent', features: ['Everything in Pro', '24/7 monitoring', 'Email alerts'], highlight: true },
          ].map((plan) => (
            <div key={plan.name} className={`glass rounded-2xl p-6 text-left ${plan.highlight ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}>
              <div className="text-gray-400 text-sm mb-1">{plan.name}</div>
              <div className="text-3xl font-bold text-white mb-1">{plan.price}<span className="text-gray-500 text-base font-normal">/mo</span></div>
              <div className="text-indigo-400 text-sm mb-4">{plan.analyses}</div>
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-block">
          Start Analyzing Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 FlipFlow. Built to find great deals faster.</p>
      </footer>
    </div>
  )
}
