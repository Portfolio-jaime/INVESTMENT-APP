import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          Welcome to Investment App
        </h1>
        <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
          Advanced tools for portfolio management, market analysis, and investment insights.
          Make informed decisions with our comprehensive platform.
        </p>
        <div className="space-x-4">
          <Link
            href="/dashboard"
            className="bg-primary text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/analysis"
            className="bg-secondary text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            Explore Tools
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Powerful Investment Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-foreground mb-4">Portfolio Dashboard</h3>
              <p className="text-foreground">
                Track your investments with real-time data and comprehensive analytics.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-foreground mb-4">Market Analysis</h3>
              <p className="text-foreground">
                Advanced technical indicators and fundamental analysis tools.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-foreground mb-4">Watchlist Management</h3>
              <p className="text-foreground">
                Monitor your favorite stocks and get personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-6">
          Ready to Optimize Your Investments?
        </h2>
        <p className="text-xl text-foreground mb-8">
          Join thousands of investors using our platform to make better decisions.
        </p>
        <Link
          href="/dashboard"
          className="bg-accent text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary transition-colors"
        >
          Start Investing Smart
        </Link>
      </section>
    </div>
  );
}
