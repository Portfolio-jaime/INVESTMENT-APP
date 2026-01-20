import { Header } from '@/components/layout/Header';
import { InvestmentList } from '@/components/features/portfolio/InvestmentList';
import { PerformanceChart } from '@/components/features/portfolio/PerformanceChart';
import { AllocationChart } from '@/components/features/portfolio/AllocationChart';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Portfolio"
        description="Manage your investments and track performance"
        breadcrumbs={[
          { label: 'Portfolio' }
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
          <PerformanceChart />
          <AllocationChart />
        </div>

        {/* Investment List */}
        <InvestmentList />
      </main>
    </div>
  );
}