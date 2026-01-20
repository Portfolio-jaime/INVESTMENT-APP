export const API_ENDPOINTS = {
  // Investments
  INVESTMENTS: '/api/investments',
  INVESTMENT: (id: string) => `/api/investments/${id}`,

  // Recommendations
  RECOMMENDATIONS: '/api/recommendations',

  // Analysis
  STOCK_ANALYSIS: (symbol: string) => `/api/analysis/${symbol}`,
  TECHNICAL_INDICATORS: (symbol: string) => `/api/analysis/${symbol}/indicators`,
  FUNDAMENTAL_DATA: (symbol: string) => `/api/analysis/${symbol}/fundamentals`,

  // Market Data
  QUOTE: (symbol: string) => `/api/market/quote/${symbol}`,
  HISTORICAL_DATA: (symbol: string) => `/api/market/historical/${symbol}`,
  MARKET_OVERVIEW: '/api/market/overview',

  // Watchlist
  WATCHLIST: '/api/watchlist',
  WATCHLIST_ITEM: (id: string) => `/api/watchlist/${id}`,
} as const;