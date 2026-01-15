/**
 * Custom hooks for API data management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService, Portfolio, Position, MarketQuote, Transaction, ApiResponse } from '../services/api';

// Generic hook for API calls
export function useApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, refetch: execute };
}

// Specific hooks for different data types
export function usePortfolios() {
  return useApiCall(() => apiService.getPortfolios());
}

export function usePortfolio(id: string | null) {
  return useApiCall(
    () => id ? apiService.getPortfolio(id) : Promise.resolve({ success: false, error: 'No ID provided' }),
    [id],
    !!id
  );
}

export function usePositions(portfolioId: string | null) {
  return useApiCall(
    () => portfolioId ? apiService.getPositions(portfolioId) : Promise.resolve({ success: false, error: 'No portfolio ID' }),
    [portfolioId],
    !!portfolioId
  );
}

export function useTransactions(portfolioId: string | null) {
  return useApiCall(
    () => portfolioId ? apiService.getTransactions(portfolioId) : Promise.resolve({ success: false, error: 'No portfolio ID' }),
    [portfolioId],
    !!portfolioId
  );
}

export function useMarketQuotes(symbols: string[]) {
  return useApiCall(
    () => symbols.length > 0 ? apiService.getQuotes(symbols) : Promise.resolve({ success: true, data: [] }),
    [symbols.join(',')],
    symbols.length > 0
  );
}

export function useTopMovers() {
  return useApiCall(() => apiService.getTopMovers());
}

export function usePortfolioSummary(portfolioId: string | null) {
  return useApiCall(
    () => portfolioId ? apiService.getPortfolioSummary(portfolioId) : Promise.resolve({ success: false, error: 'No portfolio ID' }),
    [portfolioId],
    !!portfolioId
  );
}

export function usePortfolioPerformance(portfolioId: string | null, period: string = '1M') {
  return useApiCall(
    () => portfolioId ? apiService.getPortfolioPerformance(portfolioId, period) : Promise.resolve({ success: false, error: 'No portfolio ID' }),
    [portfolioId, period],
    !!portfolioId
  );
}

// Hook for real-time data updates
export function useRealTimeData(symbols: string[], intervalMs: number = 30000) {
  const [data, setData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      const response = await apiService.getQuotes(symbols);
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch real-time data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Real-time data fetch failed');
    } finally {
      setLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    if (symbols.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [symbols.join(','), intervalMs]);

  return { data, loading, error, lastUpdate, refetch: fetchData };
}

// Hook for backend health status
export function useBackendHealth() {
  const [portfolioHealth, setPortfolioHealth] = useState<any>(null);
  const [marketDataHealth, setMarketDataHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    
    try {
      const [portfolioRes, marketRes] = await Promise.allSettled([
        apiService.checkPortfolioHealth(),
        apiService.checkMarketDataHealth()
      ]);

      if (portfolioRes.status === 'fulfilled' && portfolioRes.value.success) {
        setPortfolioHealth(portfolioRes.value.data);
      } else {
        setPortfolioHealth({ status: 'unhealthy', error: 'Connection failed' });
      }

      if (marketRes.status === 'fulfilled' && marketRes.value.success) {
        setMarketDataHealth(marketRes.value.data);
      } else {
        setMarketDataHealth({ status: 'unhealthy', error: 'Connection failed' });
      }
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    portfolioHealth,
    marketDataHealth,
    loading,
    isPortfolioHealthy: portfolioHealth?.status === 'healthy',
    isMarketDataHealthy: marketDataHealth?.status === 'healthy',
    refetch: checkHealth
  };
}