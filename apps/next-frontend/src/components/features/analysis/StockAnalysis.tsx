import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function StockAnalysis() {
  const [symbol, setSymbol] = useState('AAPL');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  // Mock data - will be replaced with real data later
  const stockData = {
    AAPL: {
      name: 'Apple Inc.',
      price: 195.50,
      change: 2.25,
      changePercent: 1.17,
      marketCap: '3.05T',
      pe: 29.8,
      dividend: 0.96,
      sector: 'Technology'
    },
    MSFT: {
      name: 'Microsoft Corporation',
      price: 415.75,
      change: 5.50,
      changePercent: 1.34,
      marketCap: '3.08T',
      pe: 32.1,
      dividend: 3.00,
      sector: 'Technology'
    },
    GOOGL: {
      name: 'Alphabet Inc.',
      price: 152.25,
      change: -1.75,
      changePercent: -1.14,
      marketCap: '1.92T',
      pe: 25.4,
      dividend: 0.80,
      sector: 'Technology'
    }
  };

  const handleAnalyze = () => {
    setSelectedSymbol(symbol);
  };

  const currentStock = stockData[selectedSymbol as keyof typeof stockData] || stockData.AAPL;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock symbol to get detailed analysis and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <Label htmlFor="symbol">Stock Symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g., AAPL, MSFT, GOOGL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>
          <Button onClick={handleAnalyze}>
            Analyze
          </Button>
        </div>

        {/* Stock Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(currentStock.price)}
            </div>
            <div className={`text-sm ${currentStock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentStock.change)} ({formatPercent(currentStock.changePercent)})
            </div>
            <div className="text-xs text-muted-foreground mt-1">Current Price</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {currentStock.marketCap}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Market Cap</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {currentStock.pe}
            </div>
            <div className="text-xs text-muted-foreground mt-1">P/E Ratio</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(currentStock.dividend)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Dividend Yield</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedSymbol} - {currentStock.name}</h3>
            <Badge>{currentStock.sector}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}