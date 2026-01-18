import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  tags: string[];
  notes?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  symbols: string[];
  color: string;
}

interface WatchlistStore {
  // Watchlist items
  items: WatchlistItem[];
  groups: WatchlistGroup[];

  // UI state
  selectedGroupId: string | null;
  searchTerm: string;

  // Actions
  addSymbol: (symbol: string, tags?: string[]) => void;
  removeSymbol: (symbol: string) => void;
  updateSymbol: (symbol: string, updates: Partial<WatchlistItem>) => void;
  addTag: (symbol: string, tag: string) => void;
  removeTag: (symbol: string, tag: string) => void;

  // Group management
  createGroup: (name: string, color: string) => void;
  deleteGroup: (groupId: string) => void;
  addToGroup: (groupId: string, symbol: string) => void;
  removeFromGroup: (groupId: string, symbol: string) => void;

  // UI actions
  setSelectedGroup: (groupId: string | null) => void;
  setSearchTerm: (term: string) => void;

  // Getters
  getSymbolsByGroup: (groupId: string) => string[];
  getSymbolsByTag: (tag: string) => string[];
  getAllTags: () => string[];
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [
        { symbol: 'AAPL', addedAt: new Date(), tags: ['tech'] },
        { symbol: 'MSFT', addedAt: new Date(), tags: ['tech'] },
        { symbol: 'GOOGL', addedAt: new Date(), tags: ['tech'] },
        { symbol: 'AMZN', addedAt: new Date(), tags: ['tech', 'e-commerce'] },
        { symbol: 'TSLA', addedAt: new Date(), tags: ['tech', 'automotive'] },
        { symbol: 'META', addedAt: new Date(), tags: ['tech', 'social'] }
      ],
      groups: [
        {
          id: 'tech-giants',
          name: 'Tech Giants',
          symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
          color: 'blue'
        },
        {
          id: 'growth',
          name: 'Growth Stocks',
          symbols: ['TSLA', 'NVDA', 'AMD'],
          color: 'green'
        }
      ],
      selectedGroupId: null,
      searchTerm: '',

      addSymbol: (symbol, tags = []) => {
        const exists = get().items.find(item => item.symbol === symbol);
        if (exists) return;

        set((state) => ({
          items: [...state.items, {
            symbol: symbol.toUpperCase(),
            addedAt: new Date(),
            tags
          }]
        }));
      },

      removeSymbol: (symbol) => {
        set((state) => ({
          items: state.items.filter(item => item.symbol !== symbol),
          groups: state.groups.map(group => ({
            ...group,
            symbols: group.symbols.filter(s => s !== symbol)
          }))
        }));
      },

      updateSymbol: (symbol, updates) => {
        set((state) => ({
          items: state.items.map(item =>
            item.symbol === symbol ? { ...item, ...updates } : item
          )
        }));
      },

      addTag: (symbol, tag) => {
        set((state) => ({
          items: state.items.map(item =>
            item.symbol === symbol && !item.tags.includes(tag)
              ? { ...item, tags: [...item.tags, tag] }
              : item
          )
        }));
      },

      removeTag: (symbol, tag) => {
        set((state) => ({
          items: state.items.map(item =>
            item.symbol === symbol
              ? { ...item, tags: item.tags.filter(t => t !== tag) }
              : item
          )
        }));
      },

      createGroup: (name, color) => {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        set((state) => ({
          groups: [...state.groups, { id, name, symbols: [], color }]
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter(g => g.id !== groupId),
          selectedGroupId: state.selectedGroupId === groupId ? null : state.selectedGroupId
        }));
      },

      addToGroup: (groupId, symbol) => {
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId && !group.symbols.includes(symbol)
              ? { ...group, symbols: [...group.symbols, symbol] }
              : group
          )
        }));
      },

      removeFromGroup: (groupId, symbol) => {
        set((state) => ({
          groups: state.groups.map(group =>
            group.id === groupId
              ? { ...group, symbols: group.symbols.filter(s => s !== symbol) }
              : group
          )
        }));
      },

      setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),

      setSearchTerm: (term) => set({ searchTerm: term }),

      getSymbolsByGroup: (groupId) => {
        const group = get().groups.find(g => g.id === groupId);
        return group?.symbols || [];
      },

      getSymbolsByTag: (tag) => {
        return get().items
          .filter(item => item.tags.includes(tag))
          .map(item => item.symbol);
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().items.forEach(item => {
          item.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
      }
    }),
    {
      name: 'watchlist-storage',
      version: 1
    }
  )
);
