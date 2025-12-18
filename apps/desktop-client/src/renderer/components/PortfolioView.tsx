import React, { useState, useEffect } from 'react';
import { getPortfolios, getPositions, Portfolio, Position } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PortfolioView: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = async () => {
    try {
      setError(null);
      const data = await getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch portfolios. Make sure Portfolio Manager is running.');
      console.error('Error fetching portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (portfolioId: string) => {
    try {
      const data = await getPositions(portfolioId);
      setPositions(data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  useEffect(() => {
    fetchPortfolios();
    const interval = setInterval(fetchPortfolios, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchPositions(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading portfolios...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
        <div className="text-gray-400 text-center py-8">
          No portfolios found. Create one to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Portfolio</h2>
        <select
          value={selectedPortfolio?.id || ''}
          onChange={(e) => {
            const portfolio = portfolios.find(p => p.id === e.target.value);
            setSelectedPortfolio(portfolio || null);
          }}
          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
        >
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPortfolio && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm mb-1">Total Value</div>
              <div className="text-white text-xl font-bold">
                ${selectedPortfolio.totalValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm mb-1">Total Gain/Loss</div>
              <div className={`text-xl font-bold ${selectedPortfolio.totalGain >= 0 ? 'text-trii-success' : 'text-trii-danger'}`}>
                ${selectedPortfolio.totalGain.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm mb-1">Return</div>
              <div className={`text-xl font-bold ${selectedPortfolio.totalGainPercent >= 0 ? 'text-trii-success' : 'text-trii-danger'}`}>
                {selectedPortfolio.totalGainPercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm mb-1">Cash</div>
              <div className="text-white text-xl font-bold">
                ${selectedPortfolio.cash.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-bold mb-3">Positions</h3>
            {positions.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No positions in this portfolio</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-600">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Avg Cost</th>
                      <th className="text-right py-2">Current Price</th>
                      <th className="text-right py-2">Market Value</th>
                      <th className="text-right py-2">Gain/Loss</th>
                      <th className="text-right py-2">Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="text-white border-b border-gray-600">
                        <td className="py-2 font-bold">{position.symbol}</td>
                        <td className="text-right">{position.quantity}</td>
                        <td className="text-right">${position.averageCost.toFixed(2)}</td>
                        <td className="text-right">${position.currentPrice.toFixed(2)}</td>
                        <td className="text-right">${position.marketValue.toLocaleString()}</td>
                        <td className={`text-right ${position.unrealizedGain >= 0 ? 'text-trii-success' : 'text-trii-danger'}`}>
                          ${position.unrealizedGain.toFixed(2)}
                        </td>
                        <td className={`text-right ${position.unrealizedGainPercent >= 0 ? 'text-trii-success' : 'text-trii-danger'}`}>
                          {position.unrealizedGainPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioView;
