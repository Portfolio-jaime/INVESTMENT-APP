import axios from 'axios';

const MARKET_DATA_API = 'http://localhost:8001';
const PORTFOLIO_API = 'http://localhost:8003';

// Market Data Service APIs
export const getQuote = async (symbol: string) => {
  const response = await axios.get(`${MARKET_DATA_API}/quotes/${symbol}`);
  return response.data;
};

export const getQuotes = async (symbols: string[]) => {
  const response = await axios.post(`${MARKET_DATA_API}/quotes/batch`, { symbols });
  return response.data;
};

export const getHistoricalData = async (symbol: string, period: string = '1mo') => {
  const response = await axios.get(`${MARKET_DATA_API}/historical/${symbol}`, {
    params: { period }
  });
  return response.data;
};

// Portfolio Manager Service APIs
export const getPortfolios = async () => {
  const response = await axios.get(`${PORTFOLIO_API}/portfolios`);
  return response.data;
};

export const getPortfolio = async (portfolioId: string) => {
  const response = await axios.get(`${PORTFOLIO_API}/portfolios/${portfolioId}`);
  return response.data;
};

export const getPositions = async (portfolioId: string) => {
  const response = await axios.get(`${PORTFOLIO_API}/portfolios/${portfolioId}/positions`);
  return response.data;
};

export const getPortfolioPerformance = async (portfolioId: string) => {
  const response = await axios.get(`${PORTFOLIO_API}/portfolios/${portfolioId}/performance`);
  return response.data;
};

// Types
export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cash: number;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
