'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AnalysisResult } from '@/lib/analyzer';
import AnalysisResultComponent from '@/components/AnalysisResult';

export default function AnalyzePage() {
  const [url, setUrl] = useState('');
  const [listingData, setListingData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, listingData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setListingData('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FF</span>
            </div>
            <span className="text-xl font-bold gradient-text">FlipFlow Analyzer</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {!result ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Analyze a Flippa Listing
              </h1>
              <p className="text-xl text-gray-600">
                Get AI-powered insights in seconds
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                    <li>Find a Flippa listing you're interested in</li>
                    <li>Copy the URL and paste it below</li>
                    <li>Copy key details (price, revenue, traffic, description) into the text area</li>
                    <li>Click "Analyze Deal" and get instant insights</li>
                  </ol>
                  <p className="mt-3 text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Include as much detail as possible for the most accurate analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="space-y-6">
                  {/* URL Input */}
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                      Flippa Listing URL *
                    </label>
                    <input
                      type="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://flippa.com/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Listing Data Textarea */}
                  <div>
                    <label htmlFor="listingData" className="block text-sm font-medium text-gray-700 mb-2">
                      Listing Details *
                    </label>
                    <textarea
                      id="listingData"
                      value={listingData}
                      onChange={(e) => setListingData(e.target.value)}
                      placeholder={`Paste key details from the listing here, for example:

Asking Price: $50,000
Monthly Revenue: $2,500
Monthly Profit: $1,800
Age: 3 years
Traffic: 15,000 monthly visitors
Monetization: Google AdSense + Affiliate
Niche: Personal Finance

Description: Established blog about budgeting and saving money...
(include any other relevant details)`}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Include: price, revenue, profit, traffic, age, monetization methods, and description
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Error</h4>
                      <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !url || !listingData}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Deal</span>
                    <ExternalLink className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sample Data */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setUrl('https://flippa.com/sample-listing');
                  setListingData(`Asking Price: $45,000
Monthly Revenue: $2,200
Monthly Profit: $1,650
Age: 2.5 years
Traffic: 12,000 monthly visitors
Traffic Source: 60% Organic, 30% Direct, 10% Social
Monetization: Google AdSense ($1,200/mo) + Amazon Associates ($800/mo) + Sponsored Posts ($200/mo)
Niche: Budget Travel & Backpacking
Platform: WordPress
Hosting: Shared hosting on SiteGround

Description:
Established travel blog focused on budget backpacking and affordable destinations. The site features destination guides, packing lists, budget tips, and travel hacks. Strong SEO presence with multiple #1 rankings for "budget travel [destination]" keywords.

Monetization primarily through AdSense and Amazon affiliate links for travel gear. Recently started accepting sponsored posts from travel brands.

Content: 85 published articles (1,500-2,500 words each), updated quarterly
Email List: 2,800 subscribers (15% open rate)
Social: 8,500 Instagram followers, 3,200 Pinterest followers
Expenses: $120/mo (hosting $40, email service $30, tools $50)

Growth potential: Could expand affiliate partnerships, create digital products (guides/ebooks), increase sponsored content rates with better media kit.`);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Load sample listing data
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Analyze Another
              </button>
            </div>

            <AnalysisResultComponent result={result} url={url} />
          </div>
        )}
      </div>
    </div>
  );
}
