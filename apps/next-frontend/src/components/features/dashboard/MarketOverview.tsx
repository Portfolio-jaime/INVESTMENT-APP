import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MarketOverview() {
  // Mock data - will be replaced with real data later
  const marketData = [
    { index: 'S&P 500', value: 4789.25, change: 45.67, changePercent: 0.96 },
    { index: 'NASDAQ', value: 14987.50, change: 123.45, changePercent: 0.83 },
    { index: 'DOW JONES', value: 37654.80, change: -23.12, changePercent: -0.06 },
    { index: 'VIX', value: 14.25, change: -0.35, changePercent: -2.40 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
        <CardDescription>
          Major indices and market sentiment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((index) => (
            <div key={index.index} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium text-foreground text-sm">
                  {index.index}
                </div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(index.value)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(index.change)}
                </div>
                <div className={`text-sm ${index.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(index.changePercent)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Market Sentiment Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Market Sentiment
            </span>
            <Badge>Bullish</Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Based on technical indicators and news analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}