import React from 'react';
import { useAppStore, Quote } from '../store/useAppStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface QuoteCardProps {
  symbol: string;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ symbol }) => {
  // Get quote from store for real-time updates
  const quote = useAppStore((state) => state.quotes[symbol]);

  if (!quote) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-slate-600 dark:text-slate-400 text-center py-4">
          Loading {symbol}...
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{quote.symbol}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Stock</p>
        </div>
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm font-semibold ${
            isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-slate-900 dark:text-white">
          {formatPrice(quote.price)}
        </div>
        <div className={`text-sm font-medium ${
          isPositive
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {isPositive ? '+' : ''}{formatPrice(quote.change)}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Volume</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {(quote.volume / 1000000).toFixed(2)}M
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Last updated: {new Date(quote.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
