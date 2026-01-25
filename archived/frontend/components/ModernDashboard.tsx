import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  Settings,
  User,
  LogOut
} from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface PortfolioStats {
  totalValue: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

const ModernDashboard: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: 'AAPL', price: 192.53, change: 2.34, changePercent: 1.23, volume: 45234567 },
    { symbol: 'GOOGL', price: 2845.67, change: -15.23, changePercent: -0.53, volume: 1234567 },
    { symbol: 'MSFT', price: 378.92, change: 4.56, changePercent: 1.22, volume: 23456789 },
    { symbol: 'TSLA', price: 248.45, change: -3.21, changePercent: -1.27, volume: 67890123 },
  ]);

  const [portfolioStats] = useState<PortfolioStats>({
    totalValue: 125847.67,
    todayChange: 2834.56,
    todayChangePercent: 2.3,
    totalReturn: 15847.67,
    totalReturnPercent: 14.4,
  });

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">TRII Platform</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-300">
                <Activity className="w-4 h-4 text-green-400" />
                <span>Live Market Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
              </button>
              
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white">
                <Settings className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-2 pl-4 border-l border-white/20">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Trader</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio Value */}
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-semibold">Portfolio Value</h2>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">
                {showBalance ? formatCurrency(portfolioStats.totalValue) : '••••••••'}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 ${
                  portfolioStats.todayChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.todayChange >= 0 ? 
                    <TrendingUp className="w-4 h-4" /> : 
                    <TrendingDown className="w-4 h-4" />
                  }
                  <span className="font-medium">
                    {showBalance ? formatCurrency(Math.abs(portfolioStats.todayChange)) : '••••'}
                  </span>
                  <span className="text-sm">
                    ({portfolioStats.todayChangePercent >= 0 ? '+' : ''}{portfolioStats.todayChangePercent}%)
                  </span>
                </div>
                <span className="text-gray-400 text-sm">today</span>
              </div>
            </div>
          </div>

          {/* Total Return */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white text-sm font-medium mb-2">Total Return</h3>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {showBalance ? formatCurrency(portfolioStats.totalReturn) : '••••••'}
            </div>
            <div className="text-green-400 text-sm font-medium">
              +{portfolioStats.totalReturnPercent}%
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white text-sm font-medium mb-2">Positions</h3>
            <div className="text-2xl font-bold text-white mb-1">12</div>
            <div className="text-orange-400 text-sm font-medium">Active</div>
          </div>
        </div>

        {/* Market Overview */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-semibold">Market Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-lg">{stock.symbol}</span>
                  <div className={`flex items-center space-x-1 ${
                    stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stock.change >= 0 ? 
                      <TrendingUp className="w-4 h-4" /> : 
                      <TrendingDown className="w-4 h-4" />
                    }
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-white text-xl font-bold">
                    {formatCurrency(stock.price)}
                  </div>
                  <div className={`text-sm font-medium ${
                    stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                  </div>
                </div>
                
                <div className="text-gray-400 text-xs">
                  Vol: {formatVolume(stock.volume)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button className="bg-gradient-to-r from-green-600/20 to-green-500/20 hover:from-green-600/30 hover:to-green-500/30 backdrop-blur-sm rounded-xl border border-green-500/20 p-4 text-white font-medium transition-all duration-200 group">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Buy</span>
            </div>
          </button>
          
          <button className="bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 backdrop-blur-sm rounded-xl border border-red-500/20 p-4 text-white font-medium transition-all duration-200 group">
            <div className="flex items-center justify-center space-x-2">
              <TrendingDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Sell</span>
            </div>
          </button>
          
          <button className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4 text-white font-medium transition-all duration-200 group">
            <div className="flex items-center justify-center space-x-2">
              <PieChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Portfolio</span>
            </div>
          </button>
          
          <button className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 text-white font-medium transition-all duration-200 group">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Analysis</span>
            </div>
          </button>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white text-xl font-semibold">AI Market Insights</h2>
            <div className="px-2 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs font-medium">
              BETA
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Market Sentiment: Bullish</p>
                  <p className="text-gray-400 text-sm">Strong buying pressure detected across tech stocks with 87% confidence.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Volatility Alert</p>
                  <p className="text-gray-400 text-sm">Expected increased volatility in energy sector due to upcoming earnings.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Portfolio Optimization</p>
                  <p className="text-gray-400 text-sm">Consider rebalancing tech allocation. Current: 65%, Recommended: 55%</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">ML Prediction</p>
                  <p className="text-gray-400 text-sm">AAPL shows 78% probability of 3-5% upward movement in next 5 days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernDashboard;