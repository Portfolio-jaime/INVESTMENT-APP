import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Menu, X, RefreshCw, AlertCircle, Home } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import PortfolioView from './components/PortfolioView';
import SetupWizard from './components/SetupWizard/SetupWizard';
import LandingPage from './components/LandingPage';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

const App: React.FC = () => {
  const [setupCompleted, setSetupCompleted] = useState(
    localStorage.getItem('trii_setup_completed') === 'true'
  );
  const [activeTab, setActiveTab] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupCompleted(true);
  };

  // Show setup wizard if not completed
  if (!setupCompleted) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const navigation = [
    { id: 'landing', label: 'Inicio', icon: Home, color: 'indigo' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
    { id: 'watchlist', label: 'Watchlist', icon: TrendingUp, color: 'green' },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart, color: 'purple' }
  ];

  const getTabColor = (tabId: string) => {
    const tab = navigation.find(t => t.id === tabId);
    return tab?.color || 'gray';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center ml-4 md:ml-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">TRII Platform</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Investment Intelligence</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isOnline
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Last Update */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                <RefreshCw size={14} />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out`}>
          <nav className="p-4 space-y-2">
            {navigation.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === id
                    ? `bg-${color}-50 dark:bg-${color}-900/20 text-${color}-700 dark:text-${color}-300 shadow-sm`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={20} className={activeTab === id ? `text-${color}-600 dark:text-${color}-400` : ''} />
                <span className="font-medium">{label}</span>
                {activeTab === id && (
                  <div className={`ml-auto w-2 h-2 rounded-full bg-${color}-500`}></div>
                )}
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Market Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">NYSE</span>
                <span className="text-green-600 font-medium">Open</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">NASDAQ</span>
                <span className="text-green-600 font-medium">Open</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">
                {navigation.find(tab => tab.id === activeTab)?.label}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                {activeTab === 'landing' && 'Bienvenido a trii - Inversiones simples para colombianos'}
                {activeTab === 'dashboard' && 'Real-time market overview and analytics'}
                {activeTab === 'watchlist' && 'Track your favorite stocks and cryptocurrencies'}
                {activeTab === 'portfolio' && 'Manage your investment portfolio'}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {activeTab === 'landing' && <LandingPage />}
              {activeTab === 'dashboard' && <Dashboard addNotification={addNotification} />}
              {activeTab === 'watchlist' && <Watchlist addNotification={addNotification} />}
              {activeTab === 'portfolio' && <PortfolioView addNotification={addNotification} />}
            </div>
          </div>
        </main>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200' :
              notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2" />
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
