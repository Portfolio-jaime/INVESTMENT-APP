import { pool } from '../config/database';
import {
  BrokerAccount,
  BrokerCredentials,
  BrokerTransaction,
  TransactionType,
  AppError,
} from '../types';
import axios from 'axios';
import crypto from 'crypto';

const BROKER_INTEGRATION_URL = process.env.BROKER_INTEGRATION_URL || 'http://broker-integration:8004';

class BrokerService {
  // Broker Account Management
  async connectBrokerAccount(
    portfolioId: number,
    brokerName: string,
    accountNumber: string,
    credentials: BrokerCredentials
  ): Promise<BrokerAccount> {
    try {
      // Encrypt credentials
      const encryptedCredentials = this.encryptCredentials(credentials);

      const result = await pool.query(
        `INSERT INTO broker_accounts
         (id, broker_name, account_number, portfolio_id, is_active, last_sync, credentials, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), $4, NOW())
         RETURNING *`,
        [brokerName, accountNumber, portfolioId, JSON.stringify(encryptedCredentials)]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error connecting broker account:', error);
      throw new AppError('Failed to connect broker account', 500);
    }
  }

  async getBrokerAccounts(portfolioId: number): Promise<BrokerAccount[]> {
    try {
      const result = await pool.query(
        'SELECT id, broker_name, account_number, portfolio_id, is_active, last_sync, created_at FROM broker_accounts WHERE portfolio_id = $1',
        [portfolioId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching broker accounts:', error);
      throw new AppError('Failed to fetch broker accounts', 500);
    }
  }

  async syncBrokerAccount(accountId: string): Promise<void> {
    try {
      const account = await this.getBrokerAccountById(accountId);
      if (!account) {
        throw new AppError('Broker account not found', 404);
      }

      // Update sync status
      await pool.query(
        'UPDATE broker_accounts SET last_sync_attempt = NOW(), sync_status = $1 WHERE id = $2',
        ['SYNCING', accountId]
      );

      // Get credentials
      const credentials = await this.getDecryptedCredentials(accountId);

      // Sync transactions based on broker
      let transactions: any[] = [];
      if (account.broker_name.toLowerCase() === 'trii') {
        transactions = await this.syncTriiTransactions(account, credentials);
      } else {
        transactions = await this.syncGenericBrokerTransactions(account, credentials);
      }

      // Process and store transactions
      for (const tx of transactions) {
        await this.processBrokerTransaction(account.portfolio_id, tx, accountId);
      }

      // Update sync status
      await pool.query(
        'UPDATE broker_accounts SET last_successful_sync = NOW(), sync_status = $1 WHERE id = $2',
        ['SUCCESS', accountId]
      );

    } catch (error) {
      // Update sync status on failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await pool.query(
        'UPDATE broker_accounts SET sync_status = $1, error_message = $2 WHERE id = $3',
        ['FAILED', errorMessage, accountId]
      );
      throw error;
    }
  }

  // Trii Broker Integration
  private async syncTriiTransactions(
    account: BrokerAccount,
    credentials: BrokerCredentials
  ): Promise<any[]> {
    try {
      const response = await axios.post(
        `${BROKER_INTEGRATION_URL}/api/v1/brokers/trii/transactions`,
        {
          account_number: account.account_number,
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
          start_date: account.last_sync?.toISOString() || '2020-01-01',
        },
        { timeout: 30000 }
      );

      return response.data.transactions || [];
    } catch (error) {
      console.error('Error syncing Trii transactions:', error);
      throw new AppError('Failed to sync Trii transactions', 500);
    }
  }

  // Generic Broker Integration
  private async syncGenericBrokerTransactions(
    account: BrokerAccount,
    credentials: BrokerCredentials
  ): Promise<any[]> {
    try {
      const response = await axios.post(
        `${BROKER_INTEGRATION_URL}/api/v1/brokers/${account.broker_name.toLowerCase()}/transactions`,
        {
          account_number: account.account_number,
          credentials: credentials,
          start_date: account.last_sync?.toISOString() || '2020-01-01',
        },
        { timeout: 30000 }
      );

      return response.data.transactions || [];
    } catch (error) {
      console.error(`Error syncing ${account.broker_name} transactions:`, error);
      throw new AppError(`Failed to sync ${account.broker_name} transactions`, 500);
    }
  }

  private async processBrokerTransaction(
    portfolioId: number,
    brokerTx: any,
    accountId: string
  ): Promise<void> {
    try {
      // Check if transaction already exists
      const existing = await pool.query(
        'SELECT id FROM broker_transactions WHERE broker_transaction_id = $1 AND broker_account_id = $2',
        [brokerTx.id, accountId]
      );

      if (existing.rows.length > 0) {
        return; // Already processed
      }

      // Convert broker transaction to internal format
      const internalTx = this.convertBrokerTransaction(brokerTx);

      // Store broker transaction
      await pool.query(
        `INSERT INTO broker_transactions
         (broker_transaction_id, portfolio_id, symbol, transaction_type, quantity, price, fees, total, transaction_date, broker_account_id, synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          brokerTx.id,
          portfolioId,
          internalTx.symbol,
          internalTx.transaction_type,
          internalTx.quantity,
          internalTx.price,
          internalTx.fees,
          internalTx.total,
          internalTx.transaction_date,
          accountId,
        ]
      );

      // Create corresponding internal transaction
      await pool.query(
        `INSERT INTO transactions
         (portfolio_id, symbol, transaction_type, quantity, price, fees, total, notes, transaction_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          portfolioId,
          internalTx.symbol,
          internalTx.transaction_type,
          internalTx.quantity,
          internalTx.price,
          internalTx.fees,
          internalTx.total,
          `Synced from ${brokerTx.broker}`,
          internalTx.transaction_date,
        ]
      );

    } catch (error) {
      console.error('Error processing broker transaction:', error);
      // Continue processing other transactions
    }
  }

  private convertBrokerTransaction(brokerTx: any): any {
    // Convert broker-specific transaction format to internal format
    return {
      symbol: brokerTx.symbol?.toUpperCase(),
      transaction_type: brokerTx.side === 'buy' ? 'BUY' : 'SELL',
      quantity: Math.abs(brokerTx.quantity),
      price: brokerTx.price,
      fees: brokerTx.fees || 0,
      total: brokerTx.total || (brokerTx.quantity * brokerTx.price),
      transaction_date: new Date(brokerTx.timestamp || brokerTx.date),
    };
  }

  // Real-time Price Sync
  async syncRealTimePrices(portfolioId: number): Promise<void> {
    try {
      // Get all positions for the portfolio
      const positions = await pool.query(
        'SELECT symbol FROM positions WHERE portfolio_id = $1',
        [portfolioId]
      );

      if (positions.rows.length === 0) return;

      const symbols = positions.rows.map(p => p.symbol);

      // Get real-time quotes
      const response = await axios.post(
        `${process.env.MARKET_DATA_SERVICE_URL || 'http://market-data:8001'}/api/v1/market-data/quotes/batch`,
        { symbols },
        { timeout: 10000 }
      );

      const quotes = response.data.quotes || [];

      // Update positions with real-time prices
      for (const quote of quotes) {
        await pool.query(
          `UPDATE positions
           SET current_price = $1, market_value = quantity * $2, last_updated = NOW()
           WHERE portfolio_id = $3 AND symbol = $4`,
          [quote.price, quote.price, portfolioId, quote.symbol]
        );
      }

    } catch (error) {
      console.error('Error syncing real-time prices:', error);
      // Don't throw error for price sync failures
    }
  }

  // Helper methods
  private async getBrokerAccountById(accountId: string): Promise<BrokerAccount | null> {
    const result = await pool.query('SELECT * FROM broker_accounts WHERE id = $1', [accountId]);
    return result.rows[0] || null;
  }

  private encryptCredentials(credentials: BrokerCredentials): any {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
    };
  }

  private async getDecryptedCredentials(accountId: string): Promise<BrokerCredentials> {
    const result = await pool.query('SELECT credentials FROM broker_accounts WHERE id = $1', [accountId]);
    if (result.rows.length === 0) {
      throw new AppError('Broker account not found', 404);
    }

    const encryptedData = JSON.parse(result.rows[0].credentials);
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');

    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // Get sync status for portfolio
  async getSyncStatus(portfolioId: number): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT id, broker_name, account_number, last_sync_attempt, last_successful_sync,
                sync_status, error_message, next_sync_scheduled
         FROM broker_accounts
         WHERE portfolio_id = $1`,
        [portfolioId]
      );

      return result.rows.map(account => ({
        account_id: account.id,
        broker_name: account.broker_name,
        account_number: account.account_number,
        last_sync_attempt: account.last_sync_attempt,
        last_successful_sync: account.last_successful_sync,
        sync_status: account.sync_status,
        error_message: account.error_message,
        next_sync_scheduled: account.next_sync_scheduled,
      }));
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw new AppError('Failed to get sync status', 500);
    }
  }
}

export default new BrokerService();