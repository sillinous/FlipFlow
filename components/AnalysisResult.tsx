'use client';

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  BarChart3,
  Lightbulb,
  Shield,
  Target,
  ExternalLink,
} from 'lucide-react';
import { AnalysisResult, formatCurrency, getScoreColor, getScoreBgColor, getSeverityColor, getImpactColor } from '@/lib/analyzer';

interface Props {
  result: AnalysisResult;
  url: string;
}

export default function AnalysisResultComponent({ result, url }: Props) {
  const getRecommendationIcon = () => {
    switch (result.recommendation.action) {
      case 'strong_buy':
      case 'buy':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case 'hold':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'pass':
      case 'avoid':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return null;
    }
  };

  const getRecommendationColor = () => {
    switch (result.recommendation.action) {
      case 'strong_buy':
        return 'bg-green-50 border-green-200';
      case 'buy':
        return 'bg-green-50 border-green-200';
      case 'hold':
        return 'bg-yellow-50 border-yellow-200';
      case 'pass':
        return 'bg-orange-50 border-orange-200';
      case 'avoid':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationText = () => {
    return result.recommendation.action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Card - Deal Score & Summary */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div className="flex-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mb-2"
            >
              <span>View Original Listing</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Analysis</h2>
            <p className="text-gray-600">{result.summary}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.score)} mb-2`}>
              {result.score}
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getScoreBgColor(result.score)} ${getScoreColor(result.score)}`}>
              {result.dealQuality.charAt(0).toUpperCase() + result.dealQuality.slice(1)} Deal
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Key Insights</span>
          </h3>
          <ul className="space-y-2">
            {result.keyInsights.map((insight, index) => (
              <li key={index} className="text-blue-800 text-sm flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className={`rounded-2xl shadow-lg border p-8 ${getRecommendationColor()}`}>
        <div className="flex items-start space-x-4">
          {getRecommendationIcon()}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Recommendation: {getRecommendationText()}
            </h3>
            <p className="text-gray-700 text-lg mb-4">{result.recommendation.reasoning}</p>
            {result.recommendation.targetPrice && (
              <div className="bg-white/50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Suggested Maximum Bid</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(result.recommendation.targetPrice)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valuation Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <span>Valuation Analysis</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Asking Price</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(result.valuation.asking)}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Fair Value Estimate</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(result.valuation.fairValue)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Valuation Range</div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(result.valuation.estimated.min)} - {formatCurrency(result.valuation.estimated.max)}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Multiple</div>
            <div className="text-2xl font-bold text-green-600">
              {result.valuation.multiple.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Value Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Undervalued</span>
            <span className="text-gray-600">Overvalued</span>
          </div>
          <div className="w-full h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full relative">
            <div
              className="absolute top-0 w-4 h-4 bg-gray-900 rounded-full transform -translate-y-0.5 -translate-x-2"
              style={{
                left: `${Math.min(Math.max(
                  ((result.valuation.asking - result.valuation.estimated.min) /
                    (result.valuation.estimated.max - result.valuation.estimated.min)) *
                    100,
                  0
                ), 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Financials Card */}
      {(result.financials.revenue || result.financials.profit) && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Financial Metrics</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {result.financials.revenue && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(result.financials.revenue)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Annual: {formatCurrency(result.financials.revenue * 12)}
                </div>
              </div>
            )}

            {result.financials.profit && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Monthly Profit</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.financials.profit)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Annual: {formatCurrency(result.financials.profit * 12)}
                </div>
              </div>
            )}

            {result.financials.profitMargin && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
                <div className="text-2xl font-bold text-purple-600">
                  {result.financials.profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.financials.profitMargin > 70 ? 'Excellent' :
                   result.financials.profitMargin > 50 ? 'Good' :
                   result.financials.profitMargin > 30 ? 'Fair' : 'Low'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risks Card */}
      {result.risks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-red-600" />
            <span>Risk Assessment</span>
          </h3>

          <div className="space-y-4">
            {result.risks.map((risk, index) => (
              <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{risk.category}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(risk.severity)}`}>
                    {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities Card */}
      {result.opportunities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-600" />
            <span>Growth Opportunities</span>
          </h3>

          <div className="space-y-4">
            {result.opportunities.map((opportunity, index) => (
              <div key={index} className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{opportunity.category}</div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getImpactColor(opportunity.impact)}`}>
                      {opportunity.impact.charAt(0).toUpperCase() + opportunity.impact.slice(1)} Impact
                    </span>
                    <div className="text-xs text-green-700 font-semibold mt-1">
                      {opportunity.estimatedValue}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{opportunity.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Make Your Move?</h3>
        <p className="text-blue-100 mb-6">
          Upgrade to Pro for unlimited analyses and automated deal finding
        </p>
        <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-all">
          Upgrade to Pro - $49/mo
        </button>
      </div>
    </div>
  );
}
