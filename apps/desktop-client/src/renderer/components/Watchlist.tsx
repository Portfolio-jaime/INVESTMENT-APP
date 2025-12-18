import React, { useState, useEffect } from 'react';
import { getQuotes, Quote } from '../services/api';
import QuoteCard from './QuoteCard';

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];

const Watchlist: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      setError(null);
      const data = await getQuotes(DEFAULT_WATCHLIST);
      setQuotes(data);
    } catch (err) {
      setError('Failed to fetch quotes. Make sure Market Data Service is running.');
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Watchlist</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading quotes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Watchlist</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Watchlist</h2>
        <button
          onClick={fetchQuotes}
          className="bg-trii-secondary hover:bg-trii-primary text-white px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((quote) => (
          <QuoteCard key={quote.symbol} quote={quote} />
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
