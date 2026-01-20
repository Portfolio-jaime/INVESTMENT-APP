import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TechnicalIndicators() {
  // Mock data - will be replaced with real data later
  const indicators = [
    {
      name: 'RSI (14)',
      value: 65.4,
      signal: 'NEUTRAL' as const,
      description: 'Relative Strength Index'
    },
    {
      name: 'MACD',
      value: 2.15,
      signal: 'BUY' as const,
      description: 'Moving Average Convergence Divergence'
    },
    {
      name: 'Moving Average (50)',
      value: 185.20,
      signal: 'BUY' as const,
      description: '50-day Simple Moving Average'
    },
    {
      name: 'Moving Average (200)',
      value: 175.80,
      signal: 'BUY' as const,
      description: '200-day Simple Moving Average'
    },
    {
      name: 'Bollinger Bands',
      value: 192.50,
      signal: 'HOLD' as const,
      description: 'Upper Bollinger Band'
    },
    {
      name: 'Stochastic Oscillator',
      value: 78.5,
      signal: 'SELL' as const,
      description: 'Stochastic %K'
    }
  ];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 text-green-800';
      case 'SELL':
        return 'bg-red-100 text-red-800';
      case 'HOLD':
      case 'NEUTRAL':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Indicators</CardTitle>
        <CardDescription>
          Key technical analysis indicators and signals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-foreground">{indicator.name}</div>
                <div className="text-sm text-muted-foreground">{indicator.description}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">
                  {typeof indicator.value === 'number' ? indicator.value.toFixed(2) : indicator.value}
                </div>
                <Badge className={getSignalColor(indicator.signal)}>
                  {indicator.signal}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Overall Technical Analysis</h4>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">Bullish</Badge>
            <span className="text-sm text-muted-foreground">
              4 buy signals, 1 sell signal, 1 neutral signal
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            The technical indicators suggest a bullish trend with strong momentum and positive moving averages.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}