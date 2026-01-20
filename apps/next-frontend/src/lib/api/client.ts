import { API_ENDPOINTS } from './endpoints';
import type { Investment, Recommendation, Stock, WatchlistItem, MarketData, TechnicalIndicator, FundamentalData, ApiResponse, PaginatedResponse } from '@/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    return this.request<Investment[]>(API_ENDPOINTS.INVESTMENTS);
  }

  async createInvestment(investment: Omit<Investment, 'id'>): Promise<Investment> {
    return this.request<Investment>(API_ENDPOINTS.INVESTMENTS, {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  async updateInvestment(id: string, investment: Partial<Investment>): Promise<Investment> {
    return this.request<Investment>(API_ENDPOINTS.INVESTMENT(id), {
      method: 'PUT',
      body: JSON.stringify(investment),
    });
  }

  async deleteInvestment(id: string): Promise<void> {
    await this.request(API_ENDPOINTS.INVESTMENT(id), {
      method: 'DELETE',
    });
  }

  // Recommendations
  async getRecommendations(): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(API_ENDPOINTS.RECOMMENDATIONS);
  }

  // Analysis
  async getStockAnalysis(symbol: string): Promise<any> {
    return this.request(API_ENDPOINTS.STOCK_ANALYSIS(symbol));
  }

  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicator[]> {
    return this.request<TechnicalIndicator[]>(API_ENDPOINTS.TECHNICAL_INDICATORS(symbol));
  }

  async getFundamentalData(symbol: string): Promise<FundamentalData> {
    return this.request<FundamentalData>(API_ENDPOINTS.FUNDAMENTAL_DATA(symbol));
  }

  // Market Data
  async getQuote(symbol: string): Promise<Stock> {
    return this.request<Stock>(API_ENDPOINTS.QUOTE(symbol));
  }

  async getHistoricalData(symbol: string, period: string = '1y'): Promise<any[]> {
    return this.request<any[]>(`${API_ENDPOINTS.HISTORICAL_DATA(symbol)}?period=${period}`);
  }

  async getMarketOverview(): Promise<MarketData[]> {
    return this.request<MarketData[]>(API_ENDPOINTS.MARKET_OVERVIEW);
  }

  // Watchlist
  async getWatchlist(): Promise<WatchlistItem[]> {
    return this.request<WatchlistItem[]>(API_ENDPOINTS.WATCHLIST);
  }

  async addToWatchlist(item: Omit<WatchlistItem, 'id'>): Promise<WatchlistItem> {
    return this.request<WatchlistItem>(API_ENDPOINTS.WATCHLIST, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await this.request(API_ENDPOINTS.WATCHLIST_ITEM(id), {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();