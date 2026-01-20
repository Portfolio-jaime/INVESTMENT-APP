export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
  pe?: number;
  dividend?: number;
  lastUpdated: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedDate: string;
  alertPrice?: number;
}