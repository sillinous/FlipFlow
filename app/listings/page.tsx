'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Loader2,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  url: string;
  asking_price: number;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  category: string | null;
  listing_status: string;
  created_at: string;
  analysis?: {
    score: number;
    deal_quality: string;
    summary: string | null;
  };
}

type SortField = 'score' | 'price' | 'revenue' | 'date';
type SortOrder = 'asc' | 'desc';

export default function ListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [minScore, setMinScore] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [category, setCategory] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (minScore) params.append('min_score', minScore.toString());
      if (maxPrice) params.append('max_price', maxPrice.toString());
      if (category) params.append('category', category);
      params.append('limit', '100');

      const response = await fetch(`/api/listings?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.listings) {
        setListings(data.listings);
      } else {
        setError(data.error || 'Failed to load listings');
      }
    } catch (err) {
      setError('Failed to load listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const sortedListings = [...listings].sort((a, b) => {
    let aVal: number, bVal: number;

    switch (sortField) {
      case 'score':
        aVal = a.analysis?.score || 0;
        bVal = b.analysis?.score || 0;
        break;
      case 'price':
        aVal = a.asking_price || 0;
        bVal = b.asking_price || 0;
        break;
      case 'revenue':
        aVal = a.monthly_revenue || 0;
        bVal = b.monthly_revenue || 0;
        break;
      case 'date':
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityBadge = (quality: string) => {
    const styles: Record<string, string> = {
      excellent: 'bg-green-100 text-green-700 border-green-200',
      good: 'bg-blue-100 text-blue-700 border-blue-200',
      fair: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      poor: 'bg-orange-100 text-orange-700 border-orange-200',
      avoid: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[quality] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Deal Listings</h1>
          <p className="text-xl text-gray-600">
            Browse and filter analyzed Flippa listings
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min Score:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value ? parseInt(e.target.value) : '')}
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Max Price:</label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : '')}
                className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="website">Website</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="saas">SaaS</option>
                <option value="app">App</option>
                <option value="domain">Domain</option>
              </select>
            </div>

            <button
              onClick={fetchListings}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </button>

            <button
              onClick={fetchListings}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-4">Listing</div>
            <button
              onClick={() => toggleSort('score')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-900"
            >
              Score
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('price')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-900"
            >
              Price
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('revenue')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-900"
            >
              Revenue
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchListings}
                className="text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedListings.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No listings found</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or run a scrape to discover new deals
              </p>
            </div>
          )}

          {/* Listings */}
          {!loading && !error && sortedListings.length > 0 && (
            <div className="divide-y divide-gray-100">
              {sortedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Title & Category */}
                  <div className="col-span-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {listing.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {listing.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-2">
                    {listing.analysis ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-md text-sm font-bold ${getScoreColor(
                            listing.analysis.score
                          )}`}
                        >
                          {listing.analysis.score}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-xs font-medium ${getQualityBadge(
                            listing.analysis.deal_quality
                          )}`}
                        >
                          {listing.analysis.deal_quality}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not analyzed</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="col-span-2">
                    <span className="font-medium text-gray-900">
                      {formatPrice(listing.asking_price)}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-2">
                    <span className="text-gray-600">
                      {formatPrice(listing.monthly_revenue)}
                      {listing.monthly_revenue && (
                        <span className="text-gray-400">/mo</span>
                      )}
                    </span>
                    {listing.monthly_profit && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatPrice(listing.monthly_profit)} profit
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/analyze?url=${encodeURIComponent(listing.url)}`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Analyze
                    </Link>
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View on Flippa"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && sortedListings.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing {sortedListings.length} listings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
