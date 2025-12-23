import React, { useState, useEffect } from 'react';
import { getQuotes, getHistoricalData, Quote, HistoricalData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ addNotification }) => {
  const [marketOverview, setMarketOverview] = useState<Quote[]>([]);
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MARKET_SYMBOLS = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, Nasdaq

  const fetchMarketOverview = async (showNotifications = false) => {
    try {
      const quotes = await getQuotes(MARKET_SYMBOLS);
      setMarketOverview(quotes);
      setError(null);
      if (showNotifications) {
        addNotification('success', 'Market data updated successfully');
      }
    } catch (err) {
      console.error('Error fetching market overview:', err);
      setError('Failed to load market overview');
      if (showNotifications) {
        addNotification('error', 'Failed to update market data');
      }
    }
  };

  const fetchChartData = async (symbol: string, showNotifications = false) => {
    try {
      const data = await getHistoricalData(symbol, '1mo');
      setChartData(data);
      setError(null);
      if (showNotifications) {
        addNotification('success', `Chart data for ${symbol} updated`);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(`Failed to load chart data for ${symbol}`);
      if (showNotifications) {
        addNotification('error', `Failed to load chart for ${symbol}`);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMarketOverview(true),
      fetchChartData(selectedSymbol, true)
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchMarketOverview(),
        fetchChartData(selectedSymbol)
      ]);
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchMarketOverview();
      fetchChartData(selectedSymbol);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [selectedSymbol]);

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
      value: `${isPositive ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
      isPositive
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="text-slate-600 dark:text-slate-300">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Data</h3>
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

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Market Overview</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            refreshing
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {refreshing ? 'Updating...' : 'Live Data'}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {marketOverview.map((quote) => {
          const change = formatChange(quote.change, quote.changePercent);
          const displayName = quote.symbol === '^GSPC' ? 'S&P 500' :
                             quote.symbol === '^DJI' ? 'Dow Jones' : 'Nasdaq';

          return (
            <div key={quote.symbol} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{displayName}</h3>
                {change.isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatPrice(quote.price)}
                </div>
                <div className={`text-sm font-medium ${
                  change.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {change.value}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Volume</span>
                  <span>{quote.volume.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Price Chart</h3>
            <p className="text-slate-600 dark:text-slate-300 mt-1">Historical price data for {selectedSymbol}</p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="AAPL">Apple (AAPL)</option>
              <option value="MSFT">Microsoft (MSFT)</option>
              <option value="GOOGL">Alphabet (GOOGL)</option>
              <option value="AMZN">Amazon (AMZN)</option>
              <option value="TSLA">Tesla (TSLA)</option>
              <option value="NVDA">NVIDIA (NVDA)</option>
              <option value="META">Meta (META)</option>
            </select>
          </div>
        </div>

        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-slate-600" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#111827'
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatPrice(value), 'Price']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">Loading chart data...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Stats */}
        {chartData.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatPrice(chartData[chartData.length - 1]?.close || 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Current Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(Math.max(...chartData.map(d => d.high)))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">52W High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatPrice(Math.min(...chartData.map(d => d.low)))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">52W Low</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                (chartData[chartData.length - 1]?.close || 0) > (chartData[0]?.close || 0)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(((chartData[chartData.length - 1]?.close || 0) - (chartData[0]?.close || 0)) / (chartData[0]?.close || 1) * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Change</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
