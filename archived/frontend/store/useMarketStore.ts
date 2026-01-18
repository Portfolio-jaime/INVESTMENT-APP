import { create } from 'zustand';
import { Quote, HistoricalData } from '../services/api';

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface MarketStore {
  // Quote data
  quotes: Record<string, CachedData<Quote>>;
  historicalData: Record<string, CachedData<HistoricalData[]>>;

  // UI state
  isOnline: boolean;
  isLoading: boolean;
  lastUpdate: Date;

  // Actions
  setQuote: (symbol: string, quote: Quote, ttl?: number) => void;
  getQuote: (symbol: string) => Quote | null;
  setHistoricalData: (symbol: string, data: HistoricalData[], ttl?: number) => void;
  getHistoricalData: (symbol: string) => HistoricalData[] | null;
  setOnlineStatus: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  updateLastUpdate: () => void;
  clearCache: () => void;
  isCacheValid: (timestamp: number, ttl: number) => boolean;
}

const DEFAULT_TTL = 30000; // 30 seconds

export const useMarketStore = create<MarketStore>((set, get) => ({
  quotes: {},
  historicalData: {},
  isOnline: true,
  isLoading: false,
  lastUpdate: new Date(),

  setQuote: (symbol, quote, ttl = DEFAULT_TTL) => {
    set((state) => ({
      quotes: {
        ...state.quotes,
        [symbol]: {
          data: quote,
          timestamp: Date.now(),
          ttl
        }
      }
    }));
  },

  getQuote: (symbol) => {
    const cached = get().quotes[symbol];
    if (!cached) return null;

    const isValid = get().isCacheValid(cached.timestamp, cached.ttl);
    return isValid ? cached.data : null;
  },

  setHistoricalData: (symbol, data, ttl = 300000) => { // 5 minutes default for historical
    set((state) => ({
      historicalData: {
        ...state.historicalData,
        [symbol]: {
          data,
          timestamp: Date.now(),
          ttl
        }
      }
    }));
  },

  getHistoricalData: (symbol) => {
    const cached = get().historicalData[symbol];
    if (!cached) return null;

    const isValid = get().isCacheValid(cached.timestamp, cached.ttl);
    return isValid ? cached.data : null;
  },

  setOnlineStatus: (status) => set({ isOnline: status }),

  setLoading: (loading) => set({ isLoading: loading }),

  updateLastUpdate: () => set({ lastUpdate: new Date() }),

  clearCache: () => set({ quotes: {}, historicalData: {} }),

  isCacheValid: (timestamp, ttl) => {
    return Date.now() - timestamp < ttl;
  }
}));
