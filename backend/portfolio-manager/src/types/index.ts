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
