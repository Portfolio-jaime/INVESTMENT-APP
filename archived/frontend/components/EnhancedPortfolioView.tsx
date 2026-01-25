import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Plus, RefreshCw, Download, Filter, Calendar, PieChart as PieIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  sector: string;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  amount: number;
  date: string;
  fees: number;
}

interface PortfolioViewProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const EnhancedPortfolioView: React.FC<PortfolioViewProps> = ({ addNotification }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState('positions');
  const [loading, setLoading] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);

  const { quotes, preferences } = useAppStore();
  const theme = preferences.theme;

  // Mock portfolio data
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 50,
        avgPrice: 150.00,
        currentPrice: 175.25,
        marketValue: 8762.50,
        unrealizedPL: 1262.50,
        unrealizedPLPercent: 16.83,
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: 25,
        avgPrice: 2800.00,
        currentPrice: 2950.75,
        marketValue: 73768.75,
        unrealizedPL: 3768.75,
        unrealizedPLPercent: 5.38,
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        quantity: 30,
        avgPrice: 220.00,
        currentPrice: 195.50,
        marketValue: 5865.00,
        unrealizedPL: -735.00,
        unrealizedPLPercent: -11.14,
        sector: 'Consumer Discretionary',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '4',
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        quantity: 40,
        avgPrice: 325.00,
        currentPrice: 365.80,
        marketValue: 14632.00,
        unrealizedPL: 1632.00,
        unrealizedPLPercent: 12.55,
        sector: 'Technology',
        lastUpdated: new Date().toISOString()
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'BUY',
        symbol: 'AAPL',
        quantity: 50,
        price: 150.00,
        amount: 7500.00,
        date: '2024-01-15',
        fees: 0.00
      },
      {
        id: '2',
        type: 'BUY',
        symbol: 'GOOGL',
        quantity: 25,
        price: 2800.00,
        amount: 70000.00,
        date: '2024-01-10',
        fees: 0.00
      },
      {
        id: '3',
        type: 'BUY',
        symbol: 'TSLA',
        quantity: 30,
        price: 220.00,
        amount: 6600.00,
        date: '2024-01-05',
        fees: 0.00
      }
    ];

    setPositions(mockPositions);
    setTransactions(mockTransactions);
  }, []);

  // Calculate portfolio metrics
  const portfolioValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.avgPrice * pos.quantity), 0);
  const totalUnrealizedPL = positions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);
  const totalUnrealizedPLPercent = (totalUnrealizedPL / totalInvested) * 100;

  // Sector allocation data
  const sectorData = positions.reduce((acc, pos) => {
    const existing = acc.find(item => item.sector === pos.sector);
    if (existing) {
      existing.value += pos.marketValue;
    } else {
      acc.push({ sector: pos.sector, value: pos.marketValue });
    }
    return acc;
  }, [] as { sector: string; value: number }[]);

  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercent = (percent: number) => 
    `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const refreshData = async () => {
    setLoading(true);
    addNotification('info', 'Refreshing portfolio data...');
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      addNotification('success', 'Portfolio data updated');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Track your investments and performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAddPosition(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Position
              </button>
              <button 
                onClick={refreshData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Portfolio Value</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolioValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gain/Loss</h3>
                <p className={`text-2xl font-bold ${totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalUnrealizedPL)}
                </p>
                <p className={`text-sm ${totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(totalUnrealizedPLPercent)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <PieIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Positions</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{positions.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active holdings</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's P&L</h3>
                <p className="text-2xl font-bold text-green-600">+{formatCurrency(1247.83)}</p>
                <p className="text-sm text-green-600">+1.22%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Positions/Transactions Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'positions', label: 'Positions', count: positions.length },
                  { id: 'transactions', label: 'Transactions', count: transactions.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'positions' ? (
                <div className="space-y-4">
                  {positions.map(position => (
                    <div key={position.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {position.symbol.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{position.symbol}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{position.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {position.quantity} shares @ {formatCurrency(position.avgPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(position.marketValue)}
                        </p>
                        <div className={`flex items-center ${position.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.unrealizedPL >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          <span className="text-sm font-medium">
                            {formatCurrency(position.unrealizedPL)} ({formatPercent(position.unrealizedPLPercent)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                          transaction.type === 'BUY' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          <span className={`text-xs font-bold ${
                            transaction.type === 'BUY' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{transaction.symbol}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {transaction.quantity} shares
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @ {formatCurrency(transaction.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sector Allocation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sector Allocation</h2>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ sector, value }) => `${sector}: ${((value / portfolioValue) * 100).toFixed(1)}%`}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
              {sectorData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: colors[index % colors.length] }}></div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item.sector}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {((item.value / portfolioValue) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPortfolioView;