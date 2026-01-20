import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AllocationChart() {
  // Mock allocation data - will be replaced with real chart later
  const allocationData = [
    { sector: 'Technology', percentage: 60, color: 'bg-blue-500' },
    { sector: 'Healthcare', percentage: 20, color: 'bg-green-500' },
    { sector: 'Financial', percentage: 15, color: 'bg-yellow-500' },
    { sector: 'Consumer', percentage: 5, color: 'bg-purple-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>
          Distribution of your investments by sector
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple pie chart placeholder */}
          <div className="flex items-center justify-center h-32">
            <div className="relative w-24 h-24">
              {allocationData.map((item, index) => {
                const rotation = index * 90; // Simple rotation for demo
                return (
                  <div
                    key={item.sector}
                    className={`absolute inset-0 ${item.color} rounded-full`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotation * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotation * Math.PI) / 180)}%)`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {allocationData.map((item) => (
              <div key={item.sector} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-muted-foreground">{item.sector}</span>
                </div>
                <span className="text-sm font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}