'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ExternalLink,
  Star,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  url: string;
  asking_price: number;
  monthly_revenue: number | null;
  category: string | null;
  analysis?: {
    score: number;
    deal_quality: string;
  };
}

export function TopDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/listings?min_score=60&limit=5');
      const data = await response.json();

      if (data.success && data.listings) {
        setDeals(data.listings);
      } else {
        setDeals([]);
      }
    } catch (err) {
      setError('Failed to load deals');
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityBadge = (quality: string) => {
    const styles: Record<string, string> = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-yellow-100 text-yellow-700',
      poor: 'bg-orange-100 text-orange-700',
      avoid: 'bg-red-100 text-red-700',
    };
    return styles[quality] || 'bg-gray-100 text-gray-700';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Top Deals
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Top Deals
        </h2>
        <button
          onClick={fetchDeals}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh deals"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchDeals}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!error && deals.length === 0 && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No high-score deals found</p>
          <p className="text-sm text-gray-500">
            Deals with scores 60+ will appear here
          </p>
        </div>
      )}

      {!error && deals.length > 0 && (
        <div className="space-y-3">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/analyze?url=${encodeURIComponent(deal.url)}`}
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {deal.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-gray-600 font-medium">
                      {formatPrice(deal.asking_price)}
                    </span>
                    {deal.monthly_revenue && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {formatPrice(deal.monthly_revenue)}/mo
                        </span>
                      </>
                    )}
                    {deal.category && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 truncate">
                          {deal.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {deal.analysis && (
                    <>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${getQualityBadge(
                          deal.analysis.deal_quality
                        )}`}
                      >
                        {deal.analysis.deal_quality}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md text-sm font-bold ${getScoreColor(
                          deal.analysis.score
                        )}`}
                      >
                        {deal.analysis.score}
                      </span>
                    </>
                  )}
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}

          <Link
            href="/listings"
            className="block text-center py-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all listings →
          </Link>
        </div>
      )}
    </div>
  );
}
