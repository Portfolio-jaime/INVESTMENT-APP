import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InvestmentList() {
  // Mock data - will be replaced with real data later
  const investments = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 50,
      purchasePrice: 180.00,
      currentPrice: 195.50,
      purchaseDate: '2024-01-15',
      sector: 'Technology',
      market: 'NASDAQ'
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      quantity: 25,
      purchasePrice: 380.00,
      currentPrice: 415.75,
      purchaseDate: '2024-02-20',
      sector: 'Technology',
      market: 'NASDAQ'
    },
    {
      id: '3',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 10,
      purchasePrice: 140.00,
      currentPrice: 152.25,
      purchaseDate: '2024-03-10',
      sector: 'Technology',
      market: 'NASDAQ'
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      quantity: 15,
      purchasePrice: 220.00,
      currentPrice: 248.50,
      purchaseDate: '2024-01-30',
      sector: 'Automotive',
      market: 'NASDAQ'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const calculateGainLoss = (current: number, purchase: number, quantity: number) => {
    const totalValue = current * quantity;
    const totalCost = purchase * quantity;
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = ((current - purchase) / purchase) * 100;
    return { gainLoss, gainLossPercent, totalValue };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Investments</CardTitle>
            <CardDescription>
              Track and manage your investment holdings
            </CardDescription>
          </div>
          <Button>Add Investment</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Gain/Loss</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => {
              const { gainLoss, gainLossPercent, totalValue } = calculateGainLoss(
                investment.currentPrice,
                investment.purchasePrice,
                investment.quantity
              );

              return (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.symbol}</TableCell>
                  <TableCell>{investment.name}</TableCell>
                  <TableCell>{investment.quantity}</TableCell>
                  <TableCell>{formatCurrency(investment.purchasePrice)}</TableCell>
                  <TableCell>{formatCurrency(investment.currentPrice)}</TableCell>
                  <TableCell>{formatCurrency(totalValue)}</TableCell>
                  <TableCell>
                    <div className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(gainLoss)} ({formatPercent(gainLossPercent)})
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{investment.sector}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button>Edit</Button>
                      <Button>Sell</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {investments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No investments found. Add your first investment to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}