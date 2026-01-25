import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function WatchlistTable() {
  // Mock data - will be replaced with real data later
  const watchlistItems = [
    {
      id: '1',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      currentPrice: 875.50,
      change: 15.25,
      changePercent: 1.77,
      alertPrice: 900.00,
      sector: 'Technology'
    },
    {
      id: '2',
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      currentPrice: 145.20,
      change: -2.10,
      changePercent: -1.43,
      alertPrice: 140.00,
      sector: 'Technology'
    },
    {
      id: '3',
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      currentPrice: 198.75,
      change: 3.45,
      changePercent: 1.76,
      alertPrice: 200.00,
      sector: 'Financial'
    },
    {
      id: '4',
      symbol: 'PFE',
      name: 'Pfizer Inc.',
      currentPrice: 28.90,
      change: 0.15,
      changePercent: 0.52,
      alertPrice: 30.00,
      sector: 'Healthcare'
    }
  ];

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
        <CardTitle>Your Watchlist</CardTitle>
        <CardDescription>
          Monitor stocks and get alerted when prices reach your target
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Alert Price</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlistItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.symbol}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{formatCurrency(item.currentPrice)}</TableCell>
                <TableCell>
                  <div className={`text-sm ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.change)} ({formatPercent(item.changePercent)})
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formatCurrency(item.alertPrice)}
                    {item.currentPrice >= item.alertPrice && (
                      <Badge>Alert Triggered</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>{item.sector}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button>Edit Alert</Button>
                    <Button>Remove</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {watchlistItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your watchlist is empty. Add stocks to start monitoring.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}