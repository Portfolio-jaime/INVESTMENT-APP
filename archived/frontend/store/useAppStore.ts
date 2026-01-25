/**
 * Central Application State Store using Zustand
 *
 * This store manages the global application state including:
 * - Market data and quotes
 * - Portfolio information
 * - Watchlist
 * - Backend service status
 * - User preferences
 * - Error states
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface Position {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  tags?: string[];
}

export interface ServiceStatus {
  name: string;
  healthy: boolean;
  lastCheck: string;
  error?: string;
}

export interface AppState {
  // Market Data
  quotes: Record<string, Quote>;
  selectedSymbol: string | null;

  // Portfolio
  portfolio: {
    positions: Position[];
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    cash: number;
  };

  // Watchlist
  watchlist: WatchlistItem[];

  // Backend Services
  services: Record<string, ServiceStatus>;
  backendHealthy: boolean;

  // UI State
  loading: boolean;
  error: string | null;

  // User Preferences
  preferences: {
    theme: 'light' | 'dark';
    refreshInterval: number; // milliseconds
    defaultView: 'dashboard' | 'portfolio' | 'watchlist';
  };

  // Actions
  setQuote: (symbol: string, quote: Quote) => void;
  setQuotes: (quotes: Record<string, Quote>) => void;
  mergeQuotes: (quotes: Record<string, Quote>) => void;
  selectSymbol: (symbol: string | null) => void;

  setPortfolio: (positions: Position[], cash: number) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;

  addToWatchlist: (symbol: string, tags?: string[]) => void;
  removeFromWatchlist: (symbol: string) => void;

  updateServiceStatus: (name: string, status: Partial<ServiceStatus>) => void;
  setBackendHealth: (healthy: boolean) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  setPreferences: (prefs: Partial<AppState['preferences']>) => void;

  // Complex actions
  refreshMarketData: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  checkBackendHealth: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        quotes: {},
        selectedSymbol: null,

        portfolio: {
          positions: [],
          totalValue: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          cash: 10000, // Initial cash
        },

        watchlist: [],

        services: {
          'market-data': { name: 'Market Data', healthy: false, lastCheck: '' },
          'analysis-engine': { name: 'Analysis Engine', healthy: false, lastCheck: '' },
          'portfolio-manager': { name: 'Portfolio Manager', healthy: false, lastCheck: '' },
          'ml-prediction': { name: 'ML Prediction', healthy: false, lastCheck: '' },
          'api-gateway': { name: 'API Gateway', healthy: false, lastCheck: '' },
        },
        backendHealthy: false,

        loading: false,
        error: null,

        preferences: {
          theme: 'dark',
          refreshInterval: 5000, // 5 seconds
          defaultView: 'dashboard',
        },

        // Actions
        setQuote: (symbol, quote) =>
          set((state) => ({
            quotes: { ...state.quotes, [symbol]: quote },
          })),

        setQuotes: (quotes) => set({ quotes }),

        mergeQuotes: (quotes) =>
          set((state) => ({
            quotes: { ...state.quotes, ...quotes },
          })),

        selectSymbol: (symbol) => set({ selectedSymbol: symbol }),

        setPortfolio: (positions, cash) => {
          const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0) + cash;
          const totalGainLoss = positions.reduce((sum, p) => sum + p.gainLoss, 0);
          const totalGainLossPercent = totalGainLoss / (totalValue - totalGainLoss) * 100;

          set({
            portfolio: {
              positions,
              totalValue,
              totalGainLoss,
              totalGainLossPercent,
              cash,
            },
          });
        },

        updatePosition: (positionId, updates) =>
          set((state) => ({
            portfolio: {
              ...state.portfolio,
              positions: state.portfolio.positions.map((p) =>
                p.id === positionId ? { ...p, ...updates } : p
              ),
            },
          })),

        addToWatchlist: (symbol, tags = []) =>
          set((state) => {
            // Check if already exists
            if (state.watchlist.some((item) => item.symbol === symbol)) {
              return state;
            }
            return {
              watchlist: [
                ...state.watchlist,
                { symbol, addedAt: new Date().toISOString(), tags },
              ],
            };
          }),

        removeFromWatchlist: (symbol) =>
          set((state) => ({
            watchlist: state.watchlist.filter((item) => item.symbol !== symbol),
          })),

        updateServiceStatus: (name, status) =>
          set((state) => ({
            services: {
              ...state.services,
              [name]: {
                ...state.services[name],
                ...status,
                lastCheck: new Date().toISOString(),
              },
            },
          })),

        setBackendHealth: (healthy) => set({ backendHealthy: healthy }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        setPreferences: (prefs) =>
          set((state) => ({
            preferences: { ...state.preferences, ...prefs },
          })),

        // Complex Actions
        refreshMarketData: async () => {
          const state = get();
          set({ loading: true, error: null });

          try {
            const symbols = [
              ...state.watchlist.map((w) => w.symbol),
              ...state.portfolio.positions.map((p) => p.symbol),
            ];

            if (symbols.length === 0) {
              set({ loading: false });
              return;
            }

            // Fetch quotes from backend
            const response = await fetch('http://localhost:8080/api/market-data/quotes/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbols }),
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch quotes: ${response.statusText}`);
            }

            const quotes = await response.json();
            set({ quotes, loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh market data',
              loading: false,
            });
          }
        },

        refreshPortfolio: async () => {
          set({ loading: true, error: null });

          try {
            const response = await fetch('http://localhost:8080/api/portfolio/positions');

            if (!response.ok) {
              throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
            }

            const data = await response.json();
            get().setPortfolio(data.positions, data.cash);
            set({ loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh portfolio',
              loading: false,
            });
          }
        },

        checkBackendHealth: async () => {
          const services = ['market-data', 'analysis-engine', 'portfolio-manager', 'ml-prediction', 'api-gateway'] as const;
          const ports: Record<typeof services[number], number> = {
            'market-data': 8001,
            'analysis-engine': 8002,
            'portfolio-manager': 8003,
            'ml-prediction': 8004,
            'api-gateway': 8080
          };

          let allHealthy = true;

          for (const service of services) {
            try {
              const response = await fetch(`http://localhost:${ports[service]}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000), // 2 second timeout
              });

              const healthy = response.ok;
              get().updateServiceStatus(service, { healthy, error: undefined });

              if (!healthy) allHealthy = false;
            } catch (error) {
              get().updateServiceStatus(service, {
                healthy: false,
                error: error instanceof Error ? error.message : 'Service unreachable',
              });
              allHealthy = false;
            }
          }

          set({ backendHealthy: allHealthy });
        },
      }),
      {
        name: 'trii-app-storage',
        partialize: (state) => ({
          // Only persist these fields
          watchlist: state.watchlist,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'TRII App Store',
    }
  )
);
