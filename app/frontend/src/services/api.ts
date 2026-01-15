/**
 * API Service - Centralized API client for backend communication
 */

// Use localhost for frontend-to-backend communication with proper headers
// The ingress routes based on Host header, so we use localhost with custom headers
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost';
const MARKET_DATA_URL = (import.meta as any).env?.VITE_MARKET_DATA_URL || 'http://localhost';

// Host headers for proper ingress routing
const PORTFOLIO_HOST = 'portfolio-manager.trii-platform.local';
const MARKET_DATA_HOST = 'market-data.trii-platform.local';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  user_id: string;
  total_value: number;
  cash_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  portfolio_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  last_updated: string;
}

export interface MarketQuote {
  symbol: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  market_cap: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  fees: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
}

class ApiService {
  private getHostHeader(url: string): string {
    if (url.includes('/api/v1/portfolios') || url.includes('/health') && url.includes(API_BASE_URL)) {
      return PORTFOLIO_HOST;
    } else if (url.includes('/quotes') || url.includes('/health') && url.includes(MARKET_DATA_URL)) {
      return MARKET_DATA_HOST;
    }
    return 'localhost';
  }

  private async request<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const hostHeader = this.getHostHeader(url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Host': hostHeader,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Portfolio endpoints
  async getPortfolios(): Promise<ApiResponse<Portfolio[]>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios`);
  }

  async getPortfolio(id: string): Promise<ApiResponse<Portfolio>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${id}`);
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Portfolio>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios`, {
      method: 'POST',
      body: JSON.stringify(portfolio),
    });
  }

  async updatePortfolio(id: string, portfolio: Partial<Portfolio>): Promise<ApiResponse<Portfolio>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(portfolio),
    });
  }

  async deletePortfolio(id: string): Promise<ApiResponse<void>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${id}`, {
      method: 'DELETE',
    });
  }

  // Position endpoints
  async getPositions(portfolioId: string): Promise<ApiResponse<Position[]>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${portfolioId}/positions`);
  }

  // Transaction endpoints
  async getTransactions(portfolioId: string): Promise<ApiResponse<Transaction[]>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${portfolioId}/transactions`);
  }

  async createTransaction(portfolioId: string, transaction: Omit<Transaction, 'id' | 'portfolio_id' | 'created_at'>): Promise<ApiResponse<Transaction>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Market data endpoints
  async getQuote(symbol: string): Promise<ApiResponse<MarketQuote>> {
    return this.request(`${MARKET_DATA_URL}/api/v1/quotes/${symbol}`);
  }

  async getQuotes(symbols: string[]): Promise<ApiResponse<MarketQuote[]>> {
    const symbolsQuery = symbols.join(',');
    return this.request(`${MARKET_DATA_URL}/api/v1/quotes?symbols=${symbolsQuery}`);
  }

  async getTopMovers(): Promise<ApiResponse<MarketQuote[]>> {
    return this.request(`${MARKET_DATA_URL}/api/v1/quotes/top-movers`);
  }

  // Portfolio analytics endpoints
  async getPortfolioSummary(portfolioId: string): Promise<ApiResponse<{
    total_value: number;
    total_cost: number;
    total_pnl: number;
    total_pnl_percent: number;
    positions_count: number;
    cash_balance: number;
  }>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${portfolioId}/summary`);
  }

  async getPortfolioPerformance(portfolioId: string, period: string = '1M'): Promise<ApiResponse<{
    start_date: string;
    end_date: string;
    start_value: number;
    end_value: number;
    total_return: number;
    total_return_percent: number;
    daily_returns: { date: string; value: number; return: number }[];
  }>> {
    return this.request(`${API_BASE_URL}/api/v1/portfolios/${portfolioId}/performance?period=${period}`);
  }

  // Health check endpoints
  async checkPortfolioHealth(): Promise<ApiResponse<any>> {
    return this.request(`${API_BASE_URL}/health`);
  }

  async checkMarketDataHealth(): Promise<ApiResponse<any>> {
    return this.request(`${MARKET_DATA_URL}/health`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;