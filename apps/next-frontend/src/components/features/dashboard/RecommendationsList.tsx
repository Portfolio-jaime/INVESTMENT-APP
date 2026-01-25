import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecommendationsList() {
  // Mock data - will be replaced with real data later
  const recommendations = [
    {
      id: '1',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      action: 'BUY' as const,
      price: 875.50,
      targetPrice: 950.00,
      confidence: 85,
      reason: 'Strong Q4 earnings and AI chip demand'
    },
    {
      id: '2',
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      action: 'HOLD' as const,
      price: 145.20,
      targetPrice: 155.00,
      confidence: 70,
      reason: 'Stable performance, waiting for market recovery'
    },
    {
      id: '3',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      action: 'SELL' as const,
      price: 248.50,
      targetPrice: 220.00,
      confidence: 60,
      reason: 'Overvalued, consider taking profits'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Recommendations</CardTitle>
        <CardDescription>
          AI-powered suggestions based on market analysis and your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium text-foreground">{rec.symbol}</div>
                  <div className="text-sm text-muted-foreground">{rec.name}</div>
                </div>
                <Badge className={getActionColor(rec.action)}>
                  {rec.action}
                </Badge>
              </div>

              <div className="text-right">
                <div className="font-medium text-foreground">
                  Current: {formatCurrency(rec.price)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {formatCurrency(rec.targetPrice)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Confidence: {rec.confidence}%
                </div>
              </div>

              <div className="max-w-xs">
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {recommendations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recommendations available at this time.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}