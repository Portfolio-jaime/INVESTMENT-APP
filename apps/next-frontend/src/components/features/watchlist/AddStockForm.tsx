import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddStockForm() {
  const [symbol, setSymbol] = useState('');
  const [alertPrice, setAlertPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement add to watchlist functionality
    console.log('Adding to watchlist:', { symbol, alertPrice });
    // Reset form
    setSymbol('');
    setAlertPrice('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add to Watchlist</CardTitle>
        <CardDescription>
          Add a stock to monitor and set price alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="symbol">Stock Symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g., AAPL, MSFT, GOOGL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="alertPrice">Alert Price (Optional)</Label>
            <Input
              id="alertPrice"
              type="number"
              step="0.01"
              placeholder="Set price alert"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
            />
          </div>

          <Button type="submit">
            Add to Watchlist
          </Button>
        </form>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Enter a stock symbol to add it to your watchlist. Optionally set a price alert to get notified when the stock reaches your target price.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}