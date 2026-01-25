import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PortfolioSummary() {
  // Mock data - will be replaced with real data later
  const portfolioData = {
    totalValue: 125000,
    totalGainLoss: 12500,
    totalGainLossPercent: 11.1,
    investments: [
      { symbol: 'AAPL', name: 'Apple Inc.', value: 45000, gainLoss: 5000, gainLossPercent: 12.5 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', value: 35000, gainLoss: 3500, gainLossPercent: 11.1 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 25000, gainLoss: 2500, gainLossPercent: 11.1 },
      { symbol: 'TSLA', name: 'Tesla Inc.', value: 20000, gainLoss: 1500, gainLossPercent: 8.1 },
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
        <CardDescription>
          Your current investment portfolio performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Total Portfolio Value */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(portfolioData.totalValue)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-medium ${portfolioData.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioData.totalGainLoss)} ({formatPercent(portfolioData.totalGainLossPercent)})
            </span>
            <Badge>
              {portfolioData.totalGainLoss >= 0 ? 'Gain' : 'Loss'}
            </Badge>
          </div>
        </div>

        {/* Individual Investments */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Holdings
          </h4>
          {portfolioData.investments.map((investment) => (
            <div key={investment.symbol} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-foreground">{investment.symbol}</div>
                  <div className="text-sm text-muted-foreground">{investment.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {formatCurrency(investment.value)}
                </div>
                <div className={`text-sm ${investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(investment.gainLoss)} ({formatPercent(investment.gainLossPercent)})
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}