import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-primary p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-foreground font-bold text-xl">
          Investment App
        </Link>
        <div className="space-x-4">
          <Link href="/dashboard" className="text-foreground hover:text-accent">
            Dashboard
          </Link>
          <Link href="/portfolio" className="text-foreground hover:text-accent">
            Portfolio
          </Link>
          <Link href="/analysis" className="text-foreground hover:text-accent">
            Analysis
          </Link>
          <Link href="/watchlist" className="text-foreground hover:text-accent">
            Watchlist
          </Link>
        </div>
      </div>
    </nav>
  );
}