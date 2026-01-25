import React, { useState, useEffect } from 'react';
import { getPortfolios, getPositions, Portfolio, Position as APIPosition } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore, Quote } from '../store/useAppStore';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioViewProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ addNotification }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [localPositions, setLocalPositions] = useState<APIPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get portfolio and quotes from store
  const portfolio = useAppStore((state) => state.portfolio);
  const quotes = useAppStore((state) => state.quotes);
  const refreshPortfolio = useAppStore((state) => state.refreshPortfolio);

  const fetchPortfolios = async () => {
    try {
      setError(null);
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch portfolios. Make sure Portfolio Manager is running.');
      console.error('Error fetching portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (portfolioId: string) => {
    try {
      const data = await getPositions(portfolioId);
      setLocalPositions(data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  useEffect(() => {
    fetchPortfolios();
    refreshPortfolio(); // Fetch portfolio from store
    const interval = setInterval(() => {
      fetchPortfolios();
      refreshPortfolio();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPositions(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="text-slate-600 dark:text-slate-300">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Portfolio</h3>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0 && portfolio.positions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Portfolio</h2>
        <div className="text-slate-600 dark:text-slate-300 text-center py-8">
          No portfolios found. Create one to get started.
        </div>
      </div>
    );
  }

  // Use store positions with real-time price updates
  const positions = portfolio.positions.map(position => {
    const quote = quotes[position.symbol];
    const currentPrice = quote?.price || position.currentPrice;
    const totalValue = position.shares * currentPrice;
    const gainLoss = totalValue - (position.shares * position.avgCost);
    const gainLossPercent = (gainLoss / (position.shares * position.avgCost)) * 100;

    return {
      ...position,
      currentPrice,
      totalValue,
      gainLoss,
      gainLossPercent,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h2>
        {portfolios.length > 0 && (
          <select
            value={selectedPortfolio?.id || ''}
            onChange={(e) => {
              const p = portfolios.find(p => p.id === e.target.value);
              setSelectedPortfolio(p || null);
            }}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Value</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Gain/Loss</div>
          <div className={`text-3xl font-bold flex items-center ${
            portfolio.totalGainLoss >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {portfolio.totalGainLoss >= 0 ? <TrendingUp className="w-6 h-6 mr-2" /> : <TrendingDown className="w-6 h-6 mr-2" />}
            ${Math.abs(portfolio.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-2">Return</div>
          <div className={`text-3xl font-bold ${
            portfolio.totalGainLossPercent >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-2">Cash</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            ${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Positions</h3>
        {positions.length === 0 ? (
          <div className="text-slate-600 dark:text-slate-400 text-center py-8">
            No positions in this portfolio
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold">Symbol</th>
                  <th className="text-right py-3 px-4 font-semibold">Shares</th>
                  <th className="text-right py-3 px-4 font-semibold">Avg Cost</th>
                  <th className="text-right py-3 px-4 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 font-semibold">Market Value</th>
                  <th className="text-right py-3 px-4 font-semibold">Gain/Loss</th>
                  <th className="text-right py-3 px-4 font-semibold">Return %</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr
                    key={position.id}
                    className="text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold">{position.symbol}</td>
                    <td className="text-right py-3 px-4">{position.shares}</td>
                    <td className="text-right py-3 px-4">${position.avgCost.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${position.currentPrice.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">${position.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      position.gainLoss >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {position.gainLoss >= 0 ? '+' : ''}${position.gainLoss.toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      position.gainLossPercent >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {position.gainLossPercent >= 0 ? '+' : ''}{position.gainLossPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioView;
