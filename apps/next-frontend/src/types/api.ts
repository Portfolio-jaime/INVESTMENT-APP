export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface MarketData {
  index: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
}

export interface FundamentalData {
  symbol: string;
  pe: number;
  pb: number;
  roe: number;
  debtToEquity: number;
  revenue: number;
  netIncome: number;
}

export interface StockAnalysis {
  symbol: string;
  technical: TechnicalIndicator[];
  fundamental: FundamentalData;
  sentiment: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}