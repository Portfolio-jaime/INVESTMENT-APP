import React, { useState, useEffect } from 'react';
import { getQuotes, getHistoricalData, Quote, HistoricalData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [marketOverview, setMarketOverview] = useState<Quote[]>([]);
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(true);

  const MARKET_SYMBOLS = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, Nasdaq

  const fetchMarketOverview = async () => {
    try {
      const quotes = await getQuotes(MARKET_SYMBOLS);
      setMarketOverview(quotes);
    } catch (err) {
      console.error('Error fetching market overview:', err);
    }
  };

  const fetchChartData = async (symbol: string) => {
    try {
      const data = await getHistoricalData(symbol, '1mo');
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchMarketOverview();
      await fetchChartData(selectedSymbol);
      setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchMarketOverview();
      fetchChartData(selectedSymbol);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketOverview.map((quote) => (
            <div key={quote.symbol} className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">
                {quote.symbol === '^GSPC' ? 'S&P 500' :
                 quote.symbol === '^DJI' ? 'Dow Jones' :
                 'Nasdaq'}
              </div>
              <div className="text-white text-2xl font-bold mb-1">
                {quote.price.toLocaleString()}
              </div>
              <div className={`text-sm ${quote.change >= 0 ? 'text-trii-success' : 'text-trii-danger'}`}>
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Price Chart</h2>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
          >
            <option value="AAPL">AAPL</option>
            <option value="MSFT">MSFT</option>
            <option value="GOOGL">GOOGL</option>
            <option value="AMZN">AMZN</option>
            <option value="TSLA">TSLA</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                itemStyle={{ color: '#3B82F6' }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
