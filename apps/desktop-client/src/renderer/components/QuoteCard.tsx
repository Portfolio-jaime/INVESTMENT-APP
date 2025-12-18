import React from 'react';
import { Quote } from '../services/api';

interface QuoteCardProps {
  quote: Quote;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
  const isPositive = quote.change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{quote.symbol}</h3>
        <span className={`text-sm font-semibold ${isPositive ? 'text-trii-success' : 'text-trii-danger'}`}>
          {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">
          ${quote.price.toFixed(2)}
        </div>
        <div className={`text-sm ${isPositive ? 'text-trii-success' : 'text-trii-danger'}`}>
          {isPositive ? '+' : ''}{quote.change.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="font-semibold">Open:</span> ${quote.open.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">High:</span> ${quote.high.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Low:</span> ${quote.low.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Vol:</span> {(quote.volume / 1000000).toFixed(2)}M
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
