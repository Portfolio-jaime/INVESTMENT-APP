import { Header } from '@/components/layout/Header';
import { PortfolioSummary } from '@/components/features/dashboard/PortfolioSummary';
import { RecommendationsList } from '@/components/features/dashboard/RecommendationsList';
import { MarketOverview } from '@/components/features/dashboard/MarketOverview';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Dashboard"
        description="Overview of your investment portfolio and market insights"
        breadcrumbs={[
          { label: 'Dashboard' }
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Portfolio Summary - takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <PortfolioSummary />
          </div>

          {/* Market Overview - takes 1 column */}
          <div className="lg:col-span-1">
            <MarketOverview />
          </div>
        </div>

        {/* Recommendations List - full width */}
        <div className="mt-8">
          <RecommendationsList />
        </div>
      </main>
    </div>
  );
}