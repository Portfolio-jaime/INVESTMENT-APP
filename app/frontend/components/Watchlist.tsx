import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getQuotes, Quote as APIQuote } from '../services/api';
import { Plus, Search, RefreshCw, AlertTriangle, Loader2, TrendingUp, TrendingDown, X, Tag } from 'lucide-react';
import { useAppStore, Quote } from '../store/useAppStore';
import { useWatchlistStore } from '../store/useWatchlistStore';

interface WatchlistProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ addNotification }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Get watchlist from stores
  const watchlistItems = useWatchlistStore((state) => state.items);
  const addSymbol = useWatchlistStore((state) => state.addSymbol);
  const removeSymbol = useWatchlistStore((state) => state.removeSymbol);
  const searchTerm = useWatchlistStore((state) => state.searchTerm);
  const setSearchTerm = useWatchlistStore((state) => state.setSearchTerm);

  // Get quotes from app store
  const quotes = useAppStore((state) => state.quotes);
  const setQuotes = useAppStore((state) => state.setQuotes);

  const watchlistSymbols = useMemo(() => watchlistItems.map(item => item.symbol), [watchlistItems]);

  const fetchQuotes = useCallback(async (showNotifications = false) => {
    if (watchlistSymbols.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      // Fetch quotes for each symbol individually to handle API rate limits
      const quotePromises = watchlistSymbols.map(async (symbol) => {
        try {
          const response = await fetch(`http://localhost:8001/api/v1/market-data/quotes/${symbol}`);
          if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
          const quote = await response.json();
          return {
            symbol: quote.symbol,
            price: parseFloat(quote.price) || 0,
            change: parseFloat(quote.change) || 0,
            changePercent: parseFloat(quote.changePercent) || 0,
            volume: parseInt(quote.volume) || 0,
            timestamp: new Date().toISOString(),
          };
        } catch (err) {
          console.warn(`Failed to fetch quote for ${symbol}:`, err);
          return {
            symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            volume: 0,
            timestamp: new Date().toISOString(),
          };
        }
      });
      
      const quotesList = await Promise.all(quotePromises);
      const quotesMap = quotesList.reduce((acc, quote) => ({
        ...acc,
        [quote.symbol]: quote
      }), {});

      setQuotes(prevQuotes => ({ ...prevQuotes, ...quotesMap }));

      if (showNotifications) {
        addNotification('success', 'Watchlist updated with real-time data');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load watchlist data. Make sure Market Data Service is running.');
      if (showNotifications) {
        addNotification('error', 'Failed to update watchlist');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [watchlistSymbols, setQuotes, addNotification]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes(true);
  };

  const handleAddSymbol = (symbol: string) => {
    const cleanSymbol = symbol.toUpperCase().trim();
    if (cleanSymbol && !watchlistSymbols.includes(cleanSymbol)) {
      addSymbol(cleanSymbol, ['stocks']);
      addNotification('success', `${cleanSymbol} added to watchlist`);
      setNewSymbol('');
      setShowAddForm(false);
    }
  };

  const handleAddSymbolForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      handleAddSymbol(newSymbol);
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    removeSymbol(symbol);
    addNotification('info', `${symbol} removed from watchlist`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(2)}`,
      percent: `(${changePercent.toFixed(2)}%)`,
      isPositive
    };
  };

  useEffect(() => {
    fetchQuotes();

    const interval = setInterval(() => fetchQuotes(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchQuotes]); // Now fetchQuotes is stable with useCallback

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="text-slate-600 dark:text-slate-300">Loading your watchlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Watchlist</h3>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get watchlist items with current quote data
  const watchlistWithQuotes = watchlistItems
    .map(item => {
      const quote = quotes[item.symbol];
      return quote ? { ...item, quote } : null;
    })
    .filter(Boolean) as Array<typeof watchlistItems[0] & { quote: Quote }>;

  const filteredWatchlist = watchlistWithQuotes.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Watchlist</h2>
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
            {watchlistSymbols.length} stocks
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Updating' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWatchlist.map((item) => {
          const change = formatChange(item.quote.change, item.quote.changePercent);

          return (
            <div key={item.symbol} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.symbol}</h3>
                  {item.tags.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Tag size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {item.tags.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveSymbol(item.symbol)}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Remove from watchlist"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatPrice(item.quote.price)}
                </div>

                <div className="flex items-center space-x-2">
                  {change.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-medium ${
                    change.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {change.value}
                  </span>
                  <span className={`text-sm ${
                    change.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {change.percent}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Volume</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {(item.quote.volume / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Symbol Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add to Watchlist</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['NFLX', 'UBER', 'SPOT', 'CRM', 'ORCL', 'ADBE', 'INTC', 'AMD'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => handleAddSymbol(symbol)}
              disabled={watchlistSymbols.includes(symbol)}
              className="flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} className="mr-2" />
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredWatchlist.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No stocks found</h3>
          <p className="text-slate-600 dark:text-slate-300">
            {searchTerm ? 'Try adjusting your search terms' : 'Add some stocks to your watchlist'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
