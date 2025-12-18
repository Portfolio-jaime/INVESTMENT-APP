import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import PortfolioView from './components/PortfolioView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>TRII Investment Platform</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Desktop Client v1.0.0</p>
      </header>

      <nav style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {['dashboard', 'watchlist', 'portfolio'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#1e3a8a' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'watchlist' && <Watchlist />}
        {activeTab === 'portfolio' && <PortfolioView />}
      </main>
    </div>
  );
};

export default App;
