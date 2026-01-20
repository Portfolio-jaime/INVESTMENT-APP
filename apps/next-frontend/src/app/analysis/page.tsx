import { Header } from '@/components/layout/Header';
import { StockAnalysis } from '@/components/features/analysis/StockAnalysis';
import { TechnicalIndicators } from '@/components/features/analysis/TechnicalIndicators';
import { FundamentalData } from '@/components/features/analysis/FundamentalData';

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Stock Analysis"
        description="Detailed technical and fundamental analysis for investment decisions"
        breadcrumbs={[
          { label: 'Analysis' }
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stock Selection and Overview */}
        <div className="mb-8">
          <StockAnalysis />
        </div>

        {/* Technical and Fundamental Analysis */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TechnicalIndicators />
          <FundamentalData />
        </div>
      </main>
    </div>
  );
}