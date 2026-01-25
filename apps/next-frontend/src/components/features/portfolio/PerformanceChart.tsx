import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PerformanceChart() {
  // Mock performance data - will be replaced with real chart later
  const performanceData = [
    { month: 'Jan', value: 100000 },
    { month: 'Feb', value: 105000 },
    { month: 'Mar', value: 102000 },
    { month: 'Apr', value: 108000 },
    { month: 'May', value: 115000 },
    { month: 'Jun', value: 125000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(value);
  };

  const maxValue = Math.max(...performanceData.map(d => d.value));
  const minValue = Math.min(...performanceData.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>
          Your portfolio value over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart placeholder */}
        <div className="space-y-4">
          <div className="flex items-end justify-between h-32 gap-2">
            {performanceData.map((data, index) => {
              const height = ((data.value - minValue) / (maxValue - minValue)) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Current Value: {formatCurrency(performanceData[performanceData.length - 1].value)}</span>
            <span className="text-green-600">
              +{((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}