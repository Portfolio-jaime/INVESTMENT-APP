'use client';

import { useEffect, useState } from 'react';
import { apiClient, Investment, Recommendation } from '../../lib/api';

export default function Dashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [investmentsResult, recommendationsResult] = await Promise.all([
          apiClient.getInvestments(),
          apiClient.getRecommendations(),
        ]);

        if (investmentsResult.error) {
          setError(`Failed to fetch investments: ${investmentsResult.error}`);
        } else {
          setInvestments(investmentsResult.data || []);
        }

        if (recommendationsResult.error) {
          setError(`Failed to fetch recommendations: ${recommendationsResult.error}`);
        } else {
          setRecommendations(recommendationsResult.data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Dashboard</h1>
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Dashboard</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Dashboard</h1>
      <p className="text-foreground mb-8">Your investment dashboard with real-time data and analytics.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Investments Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Investments</h2>
          {investments.length === 0 ? (
            <p className="text-gray-500">No investments found.</p>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-foreground">{investment.symbol}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{investment.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">${investment.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {investment.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Investment Recommendations</h2>
          {recommendations.length === 0 ? (
            <p className="text-gray-500">No recommendations available.</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-foreground">{recommendation.symbol}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{recommendation.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recommendation.risk === 'High'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : recommendation.risk === 'Low'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {recommendation.risk} Risk
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}