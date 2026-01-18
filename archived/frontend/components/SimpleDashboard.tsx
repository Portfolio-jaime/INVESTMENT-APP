import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, DollarSign, Activity } from 'lucide-react';

interface SimpleDashboardProps {
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ addNotification }) => {
  const [portfolioHealth, setPortfolioHealth] = useState<any>(null);
  const [marketHealth, setMarketHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const healthCheckDone = useRef(false);
  
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  
  useEffect(() => {
    const checkBackendHealth = async () => {
      if (healthCheckDone.current) return;
      setLoading(true);
      try {
        // Test portfolio manager
        setIsLoadingPortfolio(true);
        try {
          const portfolioResponse = await fetch('/api/v1/portfolio/health');
          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            setPortfolioHealth(portfolioData);
            addNotification('success', 'Portfolio Manager conectado');
          }
        } catch (error) {
          console.error('Portfolio health error:', error);
        } finally {
          setIsLoadingPortfolio(false);
        }
  
        // Test market data
        setIsLoadingMarket(true);
        try {
          const marketResponse = await fetch('/api/v1/market-data/health');
          if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            setMarketHealth(marketData);
            addNotification('success', 'Market Data conectado');
          }
        } catch (error) {
          console.error('Market health error:', error);
        } finally {
          setIsLoadingMarket(false);
        }
      } catch (error) {
        console.error('Error connecting to backends:', error);
        addNotification('error', 'Error conectando con backends');
      } finally {
        setLoading(false);
        healthCheckDone.current = true;
      }
    };
  
    checkBackendHealth();
  }, [addNotification]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={32} />
        <p style={{ marginTop: '1rem' }}>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          TRII Investment Platform
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Dashboard de inversiones inteligente para Colombia
        </p>
      </header>

      {/* Backend Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <BarChart3 size={24} style={{ color: '#3b82f6', marginRight: '0.5rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Portfolio Manager</h3>
          </div>
          {isLoadingPortfolio ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <RefreshCw className="animate-spin" size={24} />
              <p>Cargando...</p>
            </div>
          ) : portfolioHealth ? (
            <div>
              <p style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                ✅ Estado: {portfolioHealth.success ? 'Conectado' : 'Error'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Servicio: {portfolioHealth.data?.service || 'N/A'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Base de datos: {portfolioHealth.data?.database || 'N/A'}
              </p>
            </div>
          ) : (
            <p style={{ color: '#ef4444' }}>❌ No conectado</p>
          )}
        </div>

        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <TrendingUp size={24} style={{ color: '#10b981', marginRight: '0.5rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Market Data</h3>
          </div>
          {isLoadingMarket ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <RefreshCw className="animate-spin" size={24} />
              <p>Cargando...</p>
            </div>
          ) : marketHealth ? (
            <div>
              <p style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                ✅ Estado: Conectado
              </p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Servicio: {marketHealth.service || 'N/A'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Versión: {marketHealth.version || 'N/A'}
              </p>
            </div>
          ) : (
            <p style={{ color: '#ef4444' }}>❌ No conectado</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          padding: '1.5rem', 
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <DollarSign size={24} style={{ marginRight: '0.5rem' }} />
            <h4>Portfolio Total</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>$0.00</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Sin portfolios configurados</p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          color: 'white',
          padding: '1.5rem', 
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Activity size={24} style={{ marginRight: '0.5rem' }} />
            <h4>Rendimiento Hoy</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>+0.00%</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Sin datos de mercado</p>
        </div>
      </div>

      {/* API Test Section */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
          Pruebas de API
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open('/api/v1/portfolio/health', '_blank')}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Test Portfolio API
          </button>
          <button
            onClick={() => window.open('/api/v1/market-data/health', '_blank')}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Test Market Data API
          </button>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
          Usa estos botones para probar que las APIs están funcionando correctamente.
        </p>
      </div>
    </div>
  );
};

export default SimpleDashboard;