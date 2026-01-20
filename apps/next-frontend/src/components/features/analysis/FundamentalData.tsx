import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function FundamentalData() {
  // Mock data - will be replaced with real data later
  const fundamentals = [
    { label: 'Market Cap', value: '$3.05T', status: 'High' },
    { label: 'P/E Ratio', value: '29.8', status: 'Fair' },
    { label: 'P/B Ratio', value: '8.2', status: 'High' },
    { label: 'ROE', value: '147.4%', status: 'Excellent' },
    { label: 'Debt to Equity', value: '1.96', status: 'Moderate' },
    { label: 'Revenue (TTM)', value: '$394.3B', status: 'Strong' },
    { label: 'Net Income (TTM)', value: '$97.1B', status: 'Strong' },
    { label: 'EPS (TTM)', value: '$6.42', status: 'Strong' },
    { label: 'Dividend Yield', value: '0.49%', status: 'Low' },
    { label: 'Beta', value: '1.30', status: 'Moderate' }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent':
      case 'strong':
        return 'bg-green-100 text-green-800';
      case 'fair':
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundamental Data</CardTitle>
        <CardDescription>
          Key financial metrics and ratios for fundamental analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fundamentals.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="font-medium text-foreground">{item.label}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{item.value}</span>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Fundamental Analysis Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Strong</Badge>
              <span className="text-muted-foreground">Profitability and growth metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
              <span className="text-muted-foreground">Valuation metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800">High</Badge>
              <span className="text-muted-foreground">Debt levels</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The company shows strong profitability with excellent ROE and EPS growth,
            though valuation metrics suggest it's trading at a premium.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}