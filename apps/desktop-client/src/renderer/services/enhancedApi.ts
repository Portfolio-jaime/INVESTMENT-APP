import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Quote, HistoricalData, Portfolio, Position } from './api';

const API_BASE_URL = 'http://localhost:8080';
const MARKET_DATA_API = `${API_BASE_URL}/api/market-data`;
const PORTFOLIO_API = `${API_BASE_URL}/api/portfolio-manager`;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 10000; // 10 seconds

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: AxiosError) => void;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromAxiosError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      return new ApiError(
        error.response.data?.message || error.message,
        error.response.status,
        error
      );
    } else if (error.request) {
      // No response received
      return new ApiError(
        'Unable to connect to the server. Please check your internet connection.',
        undefined,
        error
      );
    } else {
      // Error in request setup
      return new ApiError(
        'Failed to send request. Please try again.',
        undefined,
        error
      );
    }
  }

  get isNetworkError(): boolean {
    return !this.statusCode;
  }

  get isServerError(): boolean {
    return !!this.statusCode && this.statusCode >= 500;
  }

  get isClientError(): boolean {
    return !!this.statusCode && this.statusCode >= 400 && this.statusCode < 500;
  }

  get userMessage(): string {
    if (this.isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (this.isServerError) {
      return 'The server encountered an error. Please try again in a moment.';
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (this.statusCode === 401 || this.statusCode === 403) {
      return 'You are not authorized to access this resource.';
    }
    return this.message || 'An unexpected error occurred. Please try again.';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    onRetry
  } = config;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof ApiError
        ? error
        : ApiError.fromAxiosError(error as AxiosError);

      // Don't retry on client errors (4xx)
      if (lastError.isClientError) {
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError.originalError);
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Axios instance with default config
const apiClient = axios.create({
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Market Data Service APIs
export const getQuote = async (
  symbol: string,
  retryConfig?: RetryConfig
): Promise<Quote> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${MARKET_DATA_API}/quotes/${symbol}`);
    return response.data;
  }, retryConfig);
};

export const getQuotes = async (
  symbols: string[],
  retryConfig?: RetryConfig
): Promise<Quote[]> => {
  return retryRequest(async () => {
    // Fetch quotes in parallel with individual error handling
    const results = await Promise.allSettled(
      symbols.map(symbol => getQuote(symbol, { maxRetries: 1 }))
    );

    // Extract successful results and log failures
    const quotes: Quote[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        quotes.push(result.value);
      } else {
        console.warn(`Failed to fetch quote for ${symbols[index]}:`, result.reason);
      }
    });

    return quotes;
  }, retryConfig);
};

export const getHistoricalData = async (
  symbol: string,
  period: string = '1mo',
  retryConfig?: RetryConfig
): Promise<HistoricalData[]> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${MARKET_DATA_API}/quotes/${symbol}/historical`, {
      params: {
        timeframe: period === '1mo' ? 'daily' : period,
        limit: 100
      }
    });
    return response.data;
  }, retryConfig);
};

// Portfolio Manager Service APIs
export const getPortfolios = async (
  retryConfig?: RetryConfig
): Promise<Portfolio[]> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${PORTFOLIO_API}/portfolios`);
    return response.data;
  }, retryConfig);
};

export const getPortfolio = async (
  portfolioId: string,
  retryConfig?: RetryConfig
): Promise<Portfolio> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${PORTFOLIO_API}/portfolios/${portfolioId}`);
    return response.data;
  }, retryConfig);
};

export const getPositions = async (
  portfolioId: string,
  retryConfig?: RetryConfig
): Promise<Position[]> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${PORTFOLIO_API}/portfolios/${portfolioId}/positions`);
    return response.data;
  }, retryConfig);
};

export const getPortfolioPerformance = async (
  portfolioId: string,
  retryConfig?: RetryConfig
): Promise<any> => {
  return retryRequest(async () => {
    const response = await apiClient.get(`${PORTFOLIO_API}/portfolios/${portfolioId}/performance`);
    return response.data;
  }, retryConfig);
};

// Health check utility
export const checkServiceHealth = async (
  serviceName: 'market-data' | 'portfolio-manager'
): Promise<boolean> => {
  try {
    const baseUrl = serviceName === 'market-data' ? MARKET_DATA_API : PORTFOLIO_API;
    await apiClient.get(`${baseUrl}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

export { ApiError };
export type { RetryConfig };
