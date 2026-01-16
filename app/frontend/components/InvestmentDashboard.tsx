import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, BarChart3, Activity, RefreshCw, Download } from 'lucide-react';
import { useMarketStore } from '../store/useMarketStore';
import { useAppStore } from '../store/useAppStore';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
}

interface PortfolioAllocation {
  name: string;
  value: number;
  color: string;
}

const InvestmentDashboard: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [portfolioAllocation, setPortfolioAllocation] = useState<PortfolioAllocation[]>([]);

  const { quotes, isLoading } = useMarketStore();
  const { theme } = useAppStore();

  // Popular symbols for quick selection
  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
  
  // Colors for charts
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#f97316'];

  // Mock portfolio allocation data
  useEffect(() => {
    setPortfolioAllocation([
      { name: 'Technology', value: 45, color: '#6366f1' },
      { name: 'Healthcare', value: 20, color: '#8b5cf6' },
      { name: 'Finance', value: 15, color: '#06b6d4' },
      { name: 'Energy', value: 12, color: '#10b981' },
      { name: 'Consumer', value: 8, color: '#f59e0b' }
    ]);
  }, []);

  // Mock historical data generation
  const generateChartData = (symbol: string, days: number = 30) => {
    const data: ChartData[] = [];
    const basePrice = 150 + Math.random() * 200;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const volatility = 0.02 + Math.random() * 0.03;
      const change = (Math.random() - 0.5) * volatility;
      const price = Math.max(basePrice * (1 + change), 0.01);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 5000000)
      });
    }
    
    return data;
  };

  // Load chart data when symbol or timeframe changes
  useEffect(() => {
    setLoading(true);
    
    const days = timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90;
    const data = generateChartData(selectedSymbol, days);
    
    setTimeout(() => {
      setChartData(data);
      setLoading(false);
    }, 500);
  }, [selectedSymbol, timeframe]);

  // Mock market data from real quotes
  useEffect(() => {
    const mockData: MarketData[] = popularSymbols.map(symbol => {
      const quote = quotes.find(q => q.symbol === symbol);
      return {
        symbol,
        price: quote?.price || 100 + Math.random() * 200,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(1000000 + Math.random() * 10000000),
        timestamp: new Date().toISOString()
      };
    });
    setMarketData(mockData);
  }, [quotes]);

  const formatPrice = (price: number) => `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return volume.toString();
  };

  const renderChart = () => {
    const isDark = theme === 'dark';
    const axisColor = isDark ? '#6b7280' : '#9ca3af';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading chart data...</span>
        </div>
      );
    }

    const commonProps = {
      width: '100%',
      height: 320,
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} tickFormatter={formatPrice} />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number) => [formatPrice(value), 'Price']}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                fillOpacity={0.3} 
                fill="#6366f1" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} tickFormatter={formatVolume} />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number) => [formatVolume(value), 'Volume']}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="volume" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} tickFormatter={formatPrice} />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number) => [formatPrice(value), 'Price']}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investment Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Real-time market data and portfolio analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {marketData.slice(0, 4).map((stock, index) => (
            <div key={stock.symbol} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{stock.symbol}</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stock.price)}</p>
                </div>
                <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="ml-1 font-semibold">{formatPercent(stock.changePercent)}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Volume: {formatVolume(stock.volume)}
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Price Chart</h2>
              
              {/* Chart Controls */}
              <div className="flex items-center space-x-4">
                {/* Symbol Selector */}
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {popularSymbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>

                {/* Timeframe Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {['1D', '1W', '1M', '3M'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        timeframe === tf 
                          ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Chart Type Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {[
                    { type: 'line', icon: Activity },
                    { type: 'area', icon: BarChart3 },
                    { type: 'bar', icon: BarChart3 }
                  ].map(({ type, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`p-2 rounded-md transition-colors ${
                        chartType === type 
                          ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {renderChart()}
          </div>

          {/* Portfolio Allocation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Portfolio Allocation</h2>
            
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={portfolioAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
              {portfolioAllocation.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Value</h3>
                <p className="text-2xl font-bold text-green-600">$125,847.32</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+12.5% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily P&L</h3>
                <p className="text-2xl font-bold text-green-600">+$2,847.12</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">+2.31% today</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <PieIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Positions</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active holdings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDashboard;