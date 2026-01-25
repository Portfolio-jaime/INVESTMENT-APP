import { Header } from '@/components/layout/Header';
import { WatchlistTable } from '@/components/features/watchlist/WatchlistTable';
import { AddStockForm } from '@/components/features/watchlist/AddStockForm';

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Watchlist"
        description="Monitor stocks you're interested in and set price alerts"
        breadcrumbs={[
          { label: 'Watchlist' }
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Stock Form */}
        <div className="mb-8">
          <AddStockForm />
        </div>

        {/* Watchlist Table */}
        <WatchlistTable />
      </main>
    </div>
  );
}