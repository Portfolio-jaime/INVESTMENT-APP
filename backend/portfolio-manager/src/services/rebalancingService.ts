import { pool } from '../config/database';
import {
  RebalancingSuggestion,
  RebalancingTrade,
  PositionWithDetails,
  AppError,
} from '../types';
import axios from 'axios';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://ml-prediction:8005';

class RebalancingService {
  // Get rebalancing suggestions from recommendation service
  async getRebalancingSuggestions(portfolioId: number): Promise<RebalancingSuggestion> {
    try {
      // Get current portfolio positions
      const positions = await this.getCurrentPositions(portfolioId);
      const totalValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0);

      if (totalValue === 0) {
        throw new AppError('Portfolio has no value for rebalancing', 400);
      }

      // Get current allocations
      const currentAllocations: Record<string, number> = {};
      positions.forEach(pos => {
        const allocation = (pos.market_value || 0) / totalValue;
        currentAllocations[pos.symbol] = allocation;
      });

      // Get target allocations from recommendation service
      const targetAllocations = await this.getTargetAllocations(portfolioId, positions);

      // Calculate required trades
      const tradesRequired = this.calculateRebalancingTrades(
        positions,
        currentAllocations,
        targetAllocations,
        totalValue
      );

      // Estimate costs and benefits
      const expectedCost = this.estimateRebalancingCost(tradesRequired);
      const expectedImprovement = await this.estimateImprovement(portfolioId, targetAllocations);

      return {
        portfolio_id: portfolioId,
        target_allocations: targetAllocations,
        current_allocations: currentAllocations,
        trades_required: tradesRequired,
        expected_cost: expectedCost,
        expected_improvement: expectedImprovement,
        generated_at: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error getting rebalancing suggestions:', error);
      throw new AppError('Failed to get rebalancing suggestions', 500);
    }
  }

  // Execute rebalancing trades
  async executeRebalancing(portfolioId: number, suggestion: RebalancingSuggestion): Promise<void> {
    try {
      await pool.query('BEGIN');

      // Create transactions for each trade
      for (const trade of suggestion.trades_required) {
        if (trade.quantity === 0) continue;

        // Get current price for the symbol
        const currentPrice = await this.getCurrentPrice(trade.symbol);

        await pool.query(
          `INSERT INTO transactions
           (portfolio_id, symbol, transaction_type, quantity, price, fees, total, notes, transaction_date, created_at)
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NOW(), NOW())`,
          [
            portfolioId,
            trade.symbol,
            trade.action,
            Math.abs(trade.quantity),
            currentPrice,
            Math.abs(trade.quantity) * currentPrice,
            `Rebalancing: ${trade.action} ${Math.abs(trade.quantity)} shares`,
          ]
        );
      }

      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error executing rebalancing:', error);
      throw new AppError('Failed to execute rebalancing', 500);
    }
  }

  // Get optimal portfolio allocation from recommendation service
  private async getTargetAllocations(
    portfolioId: number,
    positions: PositionWithDetails[]
  ): Promise<Record<string, number>> {
    try {
      const response = await axios.post(
        `${RECOMMENDATION_SERVICE_URL}/api/v1/recommendations/portfolio-optimization`,
        {
          portfolio_id: portfolioId,
          current_positions: positions.map(pos => ({
            symbol: pos.symbol,
            quantity: pos.quantity,
            current_price: pos.current_price,
            market_value: pos.market_value,
          })),
          risk_tolerance: 'moderate', // Could be configurable
          investment_horizon: 'long_term', // Could be configurable
        },
        { timeout: 30000 }
      );

      return response.data.target_allocations || {};
    } catch (error) {
      console.error('Error getting target allocations from recommendation service:', error);
      // Return current allocations as fallback
      const totalValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0);
      const fallbackAllocations: Record<string, number> = {};
      positions.forEach(pos => {
        fallbackAllocations[pos.symbol] = (pos.market_value || 0) / totalValue;
      });
      return fallbackAllocations;
    }
  }

  // Calculate required trades to achieve target allocations
  private calculateRebalancingTrades(
    positions: PositionWithDetails[],
    currentAllocations: Record<string, number>,
    targetAllocations: Record<string, number>,
    totalValue: number
  ): RebalancingTrade[] {
    const trades: RebalancingTrade[] = [];

    // Calculate target values
    const targetValues: Record<string, number> = {};
    Object.keys(targetAllocations).forEach(symbol => {
      targetValues[symbol] = targetAllocations[symbol] * totalValue;
    });

    // Calculate trades for existing positions
    positions.forEach(pos => {
      const currentValue = pos.market_value || 0;
      const targetValue = targetValues[pos.symbol] || 0;
      const valueDifference = targetValue - currentValue;

      if (Math.abs(valueDifference) > 1) { // Only trade if difference > $1
        const currentPrice = pos.current_price || pos.avg_cost;
        const quantityChange = valueDifference / currentPrice;

        trades.push({
          symbol: pos.symbol,
          action: quantityChange > 0 ? 'BUY' : 'SELL',
          quantity: Math.abs(quantityChange),
          estimated_price: currentPrice,
          estimated_cost: Math.abs(valueDifference),
        });
      }
    });

    // Add trades for new positions
    Object.keys(targetAllocations).forEach(symbol => {
      if (!positions.find(pos => pos.symbol === symbol)) {
        const targetValue = targetValues[symbol];
        const currentPrice = 100; // Would need to get actual price
        const quantity = targetValue / currentPrice;

        trades.push({
          symbol: symbol,
          action: 'BUY',
          quantity: quantity,
          estimated_price: currentPrice,
          estimated_cost: targetValue,
        });
      }
    });

    return trades;
  }

  // Estimate rebalancing cost (fees, slippage, etc.)
  private estimateRebalancingCost(trades: RebalancingTrade[]): number {
    let totalCost = 0;

    trades.forEach(trade => {
      // Estimate trading fees (0.1% of trade value)
      const tradingFee = trade.estimated_cost * 0.001;

      // Estimate slippage (0.05% for small trades, more for large)
      const slippage = trade.estimated_cost * 0.0005;

      totalCost += tradingFee + slippage;
    });

    return totalCost;
  }

  // Estimate improvement in risk/return profile
  private async estimateImprovement(
    portfolioId: number,
    targetAllocations: Record<string, number>
  ): Promise<{ risk_reduction: number; return_improvement: number }> {
    try {
      // This would typically involve portfolio optimization calculations
      // For now, return mock improvements
      return {
        risk_reduction: 0.05, // 5% risk reduction
        return_improvement: 0.02, // 2% return improvement
      };
    } catch (error) {
      console.error('Error estimating improvement:', error);
      return { risk_reduction: 0, return_improvement: 0 };
    }
  }

  // Helper methods
  private async getCurrentPositions(portfolioId: number): Promise<PositionWithDetails[]> {
    const result = await pool.query('SELECT * FROM positions WHERE portfolio_id = $1', [portfolioId]);
    return result.rows;
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(
        `${process.env.MARKET_DATA_SERVICE_URL || 'http://market-data:8001'}/api/v1/market-data/quotes/${symbol}`,
        { timeout: 5000 }
      );
      return response.data.price || 100; // Fallback price
    } catch (error) {
      console.warn(`Failed to get current price for ${symbol}:`, error);
      return 100; // Fallback price
    }
  }

  // Get rebalancing history
  async getRebalancingHistory(portfolioId: number, limit: number = 10): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT t.symbol, t.transaction_type, t.quantity, t.price, t.transaction_date, t.notes
         FROM transactions t
         WHERE t.portfolio_id = $1 AND t.notes LIKE '%Rebalancing%'
         ORDER BY t.transaction_date DESC
         LIMIT $2`,
        [portfolioId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting rebalancing history:', error);
      throw new AppError('Failed to get rebalancing history', 500);
    }
  }

  // Schedule automatic rebalancing
  async scheduleRebalancing(
    portfolioId: number,
    frequency: 'weekly' | 'monthly' | 'quarterly',
    threshold: number // Rebalance if allocation deviates by more than this percentage
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO rebalancing_schedules
         (portfolio_id, frequency, threshold, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW())
         ON CONFLICT (portfolio_id) DO UPDATE SET
         frequency = EXCLUDED.frequency,
         threshold = EXCLUDED.threshold,
         updated_at = NOW()`,
        [portfolioId, frequency, threshold]
      );
    } catch (error) {
      console.error('Error scheduling rebalancing:', error);
      throw new AppError('Failed to schedule rebalancing', 500);
    }
  }

  // Check if rebalancing is needed based on schedule
  async checkRebalancingNeeded(portfolioId: number): Promise<boolean> {
    try {
      const schedule = await pool.query(
        'SELECT * FROM rebalancing_schedules WHERE portfolio_id = $1 AND is_active = true',
        [portfolioId]
      );

      if (schedule.rows.length === 0) return false;

      const scheduleData = schedule.rows[0];
      const lastRebalancing = await this.getLastRebalancingDate(portfolioId);

      // Check if it's time based on frequency
      const now = new Date();
      const daysSinceLastRebalancing = lastRebalancing
        ? (now.getTime() - lastRebalancing.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      let shouldRebalance = false;
      switch (scheduleData.frequency) {
        case 'weekly':
          shouldRebalance = daysSinceLastRebalancing >= 7;
          break;
        case 'monthly':
          shouldRebalance = daysSinceLastRebalancing >= 30;
          break;
        case 'quarterly':
          shouldRebalance = daysSinceLastRebalancing >= 90;
          break;
      }

      if (!shouldRebalance) return false;

      // Check if allocations have deviated enough
      const suggestion = await this.getRebalancingSuggestions(portfolioId);
      const maxDeviation = Math.max(
        ...Object.keys(suggestion.current_allocations).map(symbol => {
          const current = suggestion.current_allocations[symbol] || 0;
          const target = suggestion.target_allocations[symbol] || 0;
          return Math.abs(current - target);
        })
      );

      return maxDeviation >= scheduleData.threshold;
    } catch (error) {
      console.error('Error checking rebalancing needed:', error);
      return false;
    }
  }

  private async getLastRebalancingDate(portfolioId: number): Promise<Date | null> {
    try {
      const result = await pool.query(
        `SELECT MAX(transaction_date) as last_date
         FROM transactions
         WHERE portfolio_id = $1 AND notes LIKE '%Rebalancing%'`,
        [portfolioId]
      );

      return result.rows[0].last_date || null;
    } catch (error) {
      console.error('Error getting last rebalancing date:', error);
      return null;
    }
  }
}

export default new RebalancingService();