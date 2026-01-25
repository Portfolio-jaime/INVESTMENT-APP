/**
 * API Configuration based on environment
 */

// Environment detection with better logic
const isDev = import.meta.env.DEV;
const isLocal = import.meta.env.VITE_ENV === 'local' || (isDev && import.meta.env.VITE_ENV !== 'cluster');
const isCluster = import.meta.env.VITE_ENV === 'cluster' || (!isDev && import.meta.env.VITE_ENV !== 'local');

// Base URL configuration
const getBaseUrl = () => {
  if (isLocal) {
    return {
      marketData: import.meta.env.VITE_MARKET_DATA_URL || 'http://localhost:8001',
      portfolio: import.meta.env.VITE_PORTFOLIO_URL || 'http://localhost:8003',
      analysis: import.meta.env.VITE_ANALYSIS_URL || 'http://localhost:8002',
      predictions: import.meta.env.VITE_PREDICTIONS_URL || 'http://localhost:8004',
    };
  } else {
    // Cluster/Production: All APIs go through ingress
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    return {
      marketData: baseUrl,
      portfolio: baseUrl,
      analysis: baseUrl,
      predictions: baseUrl,
    };
  }
};

const urls = getBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  MARKET_DATA: `${urls.marketData}/api/v1/market-data`,
  PORTFOLIO: `${urls.portfolio}/api/v1/portfolio`,
  ANALYSIS: `${urls.analysis}/api/v1/analysis`,
  PREDICTIONS: `${urls.predictions}/api/v1/predictions`,
};

// Environment info for debugging
export const ENV_INFO = {
  isLocal,
  isCluster,
  env: import.meta.env.VITE_ENV || (import.meta.env.DEV ? 'local' : 'cluster'),
  urls,
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', ENV_INFO);
  console.log('🔗 API Endpoints:', API_ENDPOINTS);
}