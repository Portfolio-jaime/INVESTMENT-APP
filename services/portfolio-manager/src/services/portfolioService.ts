import { pool, withTransaction } from '../config/database';
import {
  Portfolio,
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
  Transaction,
  CreateTransactionDTO,
  PortfolioSummary,
  PositionWithDetails,
  MarketQuote,
  TransactionType,
  AppError,
} from '../types';
import axios from 'axios';

const MARKET_DATA_SERVICE_URL = process.env.MARKET_DATA_SERVICE_URL || 'http://market-data:8001';

class PortfolioService {
  // Portfolio CRUD Operations
  async getAllPortfolios(userId?: number): Promise<Portfolio[]> {
    try {
      let query = 'SELECT * FROM portfolios WHERE is_active = true';
      const params: any[] = [];

      if (userId) {
        query += ' AND user_id = $1';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      throw new AppError('Failed to fetch portfolios', 500);
    }
  }

  async getPortfolioById(id: number): Promise<Portfolio | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM portfolios WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw new AppError('Failed to fetch portfolio', 500);
    }
  }

  async createPortfolio(data: CreatePortfolioDTO): Promise<Portfolio> {
    try {
      const result = await pool.query(
        `INSERT INTO portfolios (user_id, name, description, currency, is_active, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         RETURNING *`,
        [data.user_id, data.name, data.description, data.currency || 'USD']
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw new AppError('Failed to create portfolio', 500);
    }
  }

  async updatePortfolio(id: number, data: UpdatePortfolioDTO): Promise<Portfolio> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.currency !== undefined) {
        updates.push(`currency = $${paramCount++}`);
        values.push(data.currency);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE portfolios SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError('Portfolio not found', 404);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error updating portfolio:', error);
      throw new AppError('Failed to update portfolio', 500);
    }
  }

  async deletePortfolio(id: number): Promise<void> {
    try {
      const result = await pool.query(
        'UPDATE portfolios SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Portfolio not found', 404);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting portfolio:', error);
      throw new AppError('Failed to delete portfolio', 500);
    }
  }

  // Transaction Operations
  async getTransactions(portfolioId: number, limit: number = 100): Promise<Transaction[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM transactions
         WHERE portfolio_id = $1
         ORDER BY transaction_date DESC, created_at DESC
         LIMIT $2`,
        [portfolioId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new AppError('Failed to fetch transactions', 500);
    }
  }

  async createTransaction(
    portfolioId: number,
    data: CreateTransactionDTO
  ): Promise<Transaction> {
    try {
      return await withTransaction(async (client) => {
        // Verify portfolio exists
        const portfolioCheck = await client.query(
          'SELECT id FROM portfolios WHERE id = $1 AND is_active = true',
          [portfolioId]
        );

        if (portfolioCheck.rows.length === 0) {
          throw new AppError('Portfolio not found', 404);
        }

        // Calculate total
        const fees = data.fees || 0;
        const total = data.transaction_type === TransactionType.BUY
          ? data.quantity * data.price + fees
          : data.quantity * data.price - fees;

        // Insert transaction
        const transactionResult = await client.query(
          `INSERT INTO transactions
           (portfolio_id, symbol, transaction_type, quantity, price, fees, total, notes, transaction_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           RETURNING *`,
          [
            portfolioId,
            data.symbol.toUpperCase(),
            data.transaction_type,
            data.quantity,
            data.price,
            fees,
            total,
            data.notes,
            data.transaction_date || new Date(),
          ]
        );

        const transaction = transactionResult.rows[0];

        // Update or create position
        await this.updatePosition(client, portfolioId, transaction);

        return transaction;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating transaction:', error);
      throw new AppError('Failed to create transaction', 500);
    }
  }

  private async updatePosition(client: any, portfolioId: number, transaction: Transaction): Promise<void> {
    const { symbol, transaction_type, quantity, price } = transaction;

    // Get existing position
    const positionResult = await client.query(
      'SELECT * FROM positions WHERE portfolio_id = $1 AND symbol = $2',
      [portfolioId, symbol]
    );

    const existingPosition = positionResult.rows[0];

    if (transaction_type === TransactionType.BUY) {
      if (existingPosition) {
        // Update existing position
        const totalQuantity = existingPosition.quantity + quantity;
        const totalCost = existingPosition.quantity * existingPosition.avg_cost + quantity * price;
        const newAvgCost = totalCost / totalQuantity;

        await client.query(
          `UPDATE positions
           SET quantity = $1, avg_cost = $2, last_updated = NOW()
           WHERE portfolio_id = $3 AND symbol = $4`,
          [totalQuantity, newAvgCost, portfolioId, symbol]
        );
      } else {
        // Create new position
        await client.query(
          `INSERT INTO positions (portfolio_id, symbol, quantity, avg_cost, created_at, last_updated)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [portfolioId, symbol, quantity, price]
        );
      }
    } else if (transaction_type === TransactionType.SELL) {
      if (!existingPosition) {
        throw new AppError('Cannot sell a position that does not exist', 400);
      }

      if (existingPosition.quantity < quantity) {
        throw new AppError('Insufficient quantity to sell', 400);
      }

      const newQuantity = existingPosition.quantity - quantity;

      if (newQuantity === 0) {
        // Delete position if quantity reaches zero
        await client.query(
          'DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2',
          [portfolioId, symbol]
        );
      } else {
        // Update position quantity
        await client.query(
          `UPDATE positions
           SET quantity = $1, last_updated = NOW()
           WHERE portfolio_id = $2 AND symbol = $3`,
          [newQuantity, portfolioId, symbol]
        );
      }
    }
  }

  // Position Operations
  async getPositions(portfolioId: number): Promise<PositionWithDetails[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM positions WHERE portfolio_id = $1 ORDER BY symbol',
        [portfolioId]
      );

      const positions: PositionWithDetails[] = await Promise.all(
        result.rows.map(async (position) => {
          const totalCost = position.quantity * position.avg_cost;

          // Try to get current market price
          let latestQuote: MarketQuote | undefined;
          try {
            latestQuote = await this.getLatestQuote(position.symbol);

            if (latestQuote) {
              const marketValue = position.quantity * latestQuote.price;
              const unrealizedPnl = marketValue - totalCost;
              const unrealizedPnlPercent = (unrealizedPnl / totalCost) * 100;

              // Update position with current market data
              await pool.query(
                `UPDATE positions
                 SET current_price = $1, market_value = $2,
                     unrealized_pnl = $3, unrealized_pnl_percent = $4,
                     last_updated = NOW()
                 WHERE id = $5`,
                [latestQuote.price, marketValue, unrealizedPnl, unrealizedPnlPercent, position.id]
              );

              return {
                ...position,
                current_price: latestQuote.price,
                market_value: marketValue,
                unrealized_pnl: unrealizedPnl,
                unrealized_pnl_percent: unrealizedPnlPercent,
                total_cost: totalCost,
                latest_quote: latestQuote,
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch quote for ${position.symbol}:`, error);
          }

          return {
            ...position,
            total_cost: totalCost,
            latest_quote: latestQuote,
          };
        })
      );

      return positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw new AppError('Failed to fetch positions', 500);
    }
  }

  async getPortfolioSummary(portfolioId: number): Promise<PortfolioSummary> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      if (!portfolio) {
        throw new AppError('Portfolio not found', 404);
      }

      const positions = await this.getPositions(portfolioId);

      let totalValue = 0;
      let totalCost = 0;

      positions.forEach((position) => {
        totalCost += position.total_cost;
        totalValue += position.market_value || position.total_cost;
      });

      const totalPnl = totalValue - totalCost;
      const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

      return {
        portfolio_id: portfolio.id,
        portfolio_name: portfolio.name,
        total_value: totalValue,
        total_cost: totalCost,
        cash: 0, // TODO: Implement cash management
        total_pnl: totalPnl,
        total_pnl_percent: totalPnlPercent,
        positions_count: positions.length,
        positions: positions,
        last_updated: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error generating portfolio summary:', error);
      throw new AppError('Failed to generate portfolio summary', 500);
    }
  }

  // Market Data Integration
  private async getLatestQuote(symbol: string): Promise<MarketQuote | undefined> {
    try {
      const response = await axios.get(
        `${MARKET_DATA_SERVICE_URL}/api/v1/quotes/${symbol}`,
        { timeout: 5000 }
      );

      if (response.data && response.data.price) {
        return {
          symbol: response.data.symbol,
          price: response.data.price,
          change: response.data.change || 0,
          change_percent: response.data.change_percent || 0,
          volume: response.data.volume || 0,
          timestamp: new Date(response.data.timestamp || Date.now()),
        };
      }

      return undefined;
    } catch (error) {
      console.warn(`Market data service unavailable for ${symbol}:`, error);
      return undefined;
    }
  }
}

export default new PortfolioService();
