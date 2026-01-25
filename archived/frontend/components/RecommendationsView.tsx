import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Eye, Target, StopCircle, Clock, RefreshCw } from 'lucide-react';

interface Recommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
  confidence: number;
  reasons: string[];
  targetPrice?: number;
  stopLoss?: number;
  currentPrice: number;
  modelVersion: string;
  createdAt: string;
  expiresAt: string;
}

interface RecommendationsViewProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const RecommendationsView: React.FC<RecommendationsViewProps> = ({ addNotification }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'HOLD' | 'SELL' | 'AVOID'>('ALL');
  const [sortBy, setSortBy] = useState<'confidence' | 'createdAt'>('confidence');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ml-prediction/recommendations');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setLastUpdate(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(errorMessage);
      addNotification('error', `Failed to load recommendations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'HOLD':
        return <Minus className="w-5 h-5 text-blue-600" />;
      case 'AVOID':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HOLD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AVOID':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredAndSortedRecommendations = recommendations
    .filter(rec => filter === 'ALL' || rec.action === filter)
    .sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleAddToWatchlist = (symbol: string) => {
    // This would integrate with the watchlist store
    addNotification('success', `${symbol} added to watchlist`);
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Recommendations
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Machine learning powered investment insights
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Last updated: {lastUpdate.toLocaleTimeString()}
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 self-center">Filter:</span>
          {['ALL', 'BUY', 'HOLD', 'SELL', 'AVOID'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'confidence' | 'createdAt')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          >
            <option value="confidence">Confidence</option>
            <option value="createdAt">Time</option>
          </select>
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredAndSortedRecommendations.length === 0 ? (
        <div className="text-center py-12">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {filter === 'ALL' 
              ? 'No recommendations available at the moment.'
              : `No ${filter} recommendations found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedRecommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {recommendation.symbol}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ${recommendation.currentPrice.toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getActionColor(recommendation.action)}`}>
                  {getActionIcon(recommendation.action)}
                  <span className="font-semibold text-sm">{recommendation.action}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confidence
                  </span>
                  <span className={`font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                    {(recommendation.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      recommendation.confidence >= 0.8
                        ? 'bg-green-500'
                        : recommendation.confidence >= 0.6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Prices */}
              {(recommendation.targetPrice || recommendation.stopLoss) && (
                <div className="mb-4 space-y-2">
                  {recommendation.targetPrice && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Target className="w-3 h-3" />
                        Target Price
                      </span>
                      <span className="font-semibold text-green-600">
                        ${recommendation.targetPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {recommendation.stopLoss && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <StopCircle className="w-3 h-3" />
                        Stop Loss
                      </span>
                      <span className="font-semibold text-red-600">
                        ${recommendation.stopLoss.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reasons */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Reasons
                </h4>
                <ul className="space-y-1">
                  {recommendation.reasons.slice(0, 3).map((reason, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToWatchlist(recommendation.symbol)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add to Watchlist
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  Details
                </button>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Model: {recommendation.modelVersion}</span>
                  <span>
                    {new Date(recommendation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsView;
