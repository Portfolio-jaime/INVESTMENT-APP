export interface Recommendation {
  id: string;
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  targetPrice?: number;
  reasoning: string;
  date: string;
  source: string;
}