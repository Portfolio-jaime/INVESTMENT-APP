const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

export interface Investment {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Recommendation {
  id: number;
  symbol: string;
  name: string;
  reason: string;
  risk: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Investments API
  async getInvestments(): Promise<ApiResponse<Investment[]>> {
    const result = await this.request<{ investments: Investment[] }>('/investments');
    if (result.data) {
      return { data: result.data.investments };
    }
    return result as ApiResponse<Investment[]>;
  }

  async getInvestment(id: number): Promise<ApiResponse<Investment>> {
    const result = await this.request<{ investment: Investment }>(`/investments/${id}`);
    if (result.data) {
      return { data: result.data.investment };
    }
    return result as ApiResponse<Investment>;
  }

  async createInvestment(investment: Omit<Investment, 'id'>): Promise<ApiResponse<Investment>> {
    const result = await this.request<{ investment: Investment }>('/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
    if (result.data) {
      return { data: result.data.investment };
    }
    return result as ApiResponse<Investment>;
  }

  // Recommendations API
  async getRecommendations(): Promise<ApiResponse<Recommendation[]>> {
    const result = await this.request<{ recommendations: Recommendation[] }>('/recommendations');
    if (result.data) {
      return { data: result.data.recommendations };
    }
    return result as ApiResponse<Recommendation[]>;
  }

  async getRecommendation(id: number): Promise<ApiResponse<Recommendation>> {
    const result = await this.request<{ recommendation: Recommendation }>(`/recommendations/${id}`);
    if (result.data) {
      return { data: result.data.recommendation };
    }
    return result as ApiResponse<Recommendation>;
  }

  async createRecommendation(recommendation: Omit<Recommendation, 'id'>): Promise<ApiResponse<Recommendation>> {
    const result = await this.request<{ recommendation: Recommendation }>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(recommendation),
    });
    if (result.data) {
      return { data: result.data.recommendation };
    }
    return result as ApiResponse<Recommendation>;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);