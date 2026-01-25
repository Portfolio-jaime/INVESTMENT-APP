import { Request } from 'express';

// Portfolio Types
export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface CreatePortfolioDTO {
  user_id: number;
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdatePortfolioDTO {
  name?: string;
  description?: string;
  currency?: string;
  is_active?: boolean;
}

// Transaction Types
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Transaction {
  id: number;
  portfolio_id: number;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  total: number;
  notes?: string;
  transaction_date: Date;
  created_at: Date;
}

export interface CreateTransactionDTO {
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
  transaction_date?: Date;
}

// Position Types
export interface Position {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price?: number;
  market_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  last_updated: Date;
  created_at: Date;
}

export interface PositionWithDetails extends Position {
  total_cost: number;
  latest_quote?: MarketQuote;
}

// Portfolio Summary Types
export interface PortfolioSummary {
  portfolio_id: number;
  portfolio_name: string;
  total_value: number;
  total_cost: number;
  cash: number;
  total_pnl: number;
  total_pnl_percent: number;
  positions_count: number;
  positions: PositionWithDetails[];
  last_updated: Date;
}

// Market Data Types (from market-data service)
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Extended Request Types
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Performance Analytics Types
export interface PerformanceMetrics {
  portfolio_id: number;
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  beta: number;
  alpha: number;
  sortino_ratio: number;
  calmar_ratio: number;
  information_ratio: number;
  tracking_error: number;
  period: string; // '1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'
  calculated_at: Date;
}

export interface HistoricalPerformance {
  date: Date;
  value: number;
  return: number;
  cumulative_return: number;
}

// Risk Metrics Types
export interface RiskMetrics {
  portfolio_id: number;
  value_at_risk_95: number; // 95% VaR
  value_at_risk_99: number; // 99% VaR
  expected_shortfall_95: number;
  expected_shortfall_99: number;
  beta: number;
  correlation_matrix: Record<string, Record<string, number>>;
  stress_test_results: StressTestResult[];
  calculated_at: Date;
}

export interface StressTestResult {
  scenario: string;
  loss_percentage: number;
  portfolio_value_after: number;
}

// Diversification Analysis Types
export interface DiversificationAnalysis {
  portfolio_id: number;
  sector_allocation: Record<string, number>; // sector -> percentage
  asset_class_allocation: Record<string, number>; // asset_class -> percentage
  geographic_allocation: Record<string, number>; // country/region -> percentage
  concentration_risk: {
    top_10_holdings_percentage: number;
    herfindahl_index: number;
  };
  correlation_matrix: Record<string, Record<string, number>>;
  diversification_score: number; // 0-100, higher is better diversified
  calculated_at: Date;
}

// Tax Calculation Types (Colombian)
export interface TaxCalculation {
  portfolio_id: number;
  year: number;
  capital_gains_tax: number;
  iva_tax: number;
  trm_impact: number; // Currency exchange impact
  total_tax_liability: number;
  effective_tax_rate: number;
  tax_efficiency_score: number; // 0-100, higher is more tax efficient
  details: TaxDetail[];
  calculated_at: Date;
}

export interface TaxDetail {
  symbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  gain_loss: number;
  tax_amount: number;
  tax_type: 'CAPITAL_GAINS' | 'IVA' | 'CURRENCY';
  transaction_date: Date;
}

// Broker Integration Types
export interface BrokerAccount {
  id: string;
  broker_name: string;
  account_number: string;
  portfolio_id: number;
  is_active: boolean;
  last_sync: Date;
  credentials: BrokerCredentials; // encrypted
}

export interface BrokerCredentials {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  username?: string;
  password?: string; // encrypted
}

export interface BrokerTransaction {
  broker_transaction_id: string;
  portfolio_id: number;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  total: number;
  transaction_date: Date;
  broker_account_id: string;
  synced_at: Date;
}

// Rebalancing Types
export interface RebalancingSuggestion {
  portfolio_id: number;
  target_allocations: Record<string, number>; // symbol -> target percentage
  current_allocations: Record<string, number>;
  trades_required: RebalancingTrade[];
  expected_cost: number;
  expected_improvement: {
    risk_reduction: number;
    return_improvement: number;
  };
  generated_at: Date;
}

export interface RebalancingTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  estimated_price: number;
  estimated_cost: number;
}

// Real-time Sync Types
export interface SyncStatus {
  portfolio_id: number;
  last_sync_attempt: Date;
  last_successful_sync: Date;
  sync_status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  error_message?: string;
  next_sync_scheduled: Date;
}
