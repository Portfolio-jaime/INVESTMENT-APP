import { pool } from '../config/database';
import {
  PerformanceMetrics,
  HistoricalPerformance,
  RiskMetrics,
  DiversificationAnalysis,
  TaxCalculation,
  PortfolioSummary,
  Transaction,
  PositionWithDetails,
  AppError,
} from '../types';
import axios from 'axios';

const MARKET_DATA_SERVICE_URL = process.env.MARKET_DATA_SERVICE_URL || 'http://market-data:8001';
const ANALYSIS_ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || 'http://analysis-engine:8002';

class AnalyticsService {
  // Performance Analytics
  async calculatePerformanceMetrics(
    portfolioId: number,
    period: string = '1Y'
  ): Promise<PerformanceMetrics> {
    try {
      // Get historical portfolio values
      const historicalData = await this.getHistoricalPortfolioValues(portfolioId, period);

      if (historicalData.length < 2) {
        throw new AppError('Insufficient data for performance calculation', 400);
      }

      // Calculate returns
      const returns = this.calculateReturns(historicalData);
      const totalReturn = this.calculateTotalReturn(historicalData);
      const annualizedReturn = this.calculateAnnualizedReturn(totalReturn, period);

      // Calculate volatility (standard deviation of returns)
      const volatility = this.calculateVolatility(returns);

      // Calculate Sharpe ratio (assuming risk-free rate of 3%)
      const riskFreeRate = 0.03;
      const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

      // Calculate max drawdown
      const maxDrawdown = this.calculateMaxDrawdown(historicalData);

      // Calculate beta and alpha (against market index, simplified)
      const marketReturns = await this.getMarketReturns(period);
      const beta = this.calculateBeta(returns, marketReturns);
      const alpha = annualizedReturn - (riskFreeRate + beta * (marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length - riskFreeRate));

      // Calculate Sortino ratio (downside deviation)
      const downsideReturns = returns.filter(r => r < 0);
      const downsideDeviation = downsideReturns.length > 0
        ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length)
        : 0;
      const sortinoRatio = downsideDeviation > 0 ? (annualizedReturn - riskFreeRate) / downsideDeviation : 0;

      // Calculate Calmar ratio
      const calmarRatio = maxDrawdown > 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

      // Calculate Information ratio (tracking error vs benchmark)
      const trackingError = this.calculateTrackingError(returns, marketReturns);
      const informationRatio = trackingError > 0 ? alpha / trackingError : 0;

      return {
        portfolio_id: portfolioId,
        total_return: totalReturn,
        annualized_return: annualizedReturn,
        volatility: volatility,
        sharpe_ratio: sharpeRatio,
        max_drawdown: maxDrawdown,
        beta: beta,
        alpha: alpha,
        sortino_ratio: sortinoRatio,
        calmar_ratio: calmarRatio,
        information_ratio: informationRatio,
        tracking_error: trackingError,
        period: period,
        calculated_at: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error calculating performance metrics:', error);
      throw new AppError('Failed to calculate performance metrics', 500);
    }
  }

  // Risk Metrics
  async calculateRiskMetrics(portfolioId: number): Promise<RiskMetrics> {
    try {
      const positions = await this.getCurrentPositions(portfolioId);
      const historicalData = await this.getHistoricalPortfolioValues(portfolioId, '1Y');

      if (positions.length === 0) {
        throw new AppError('No positions found for risk calculation', 400);
      }

      // Calculate VaR using historical simulation
      const returns = this.calculateReturns(historicalData);
      const valueAtRisk95 = this.calculateVaR(returns, 0.95);
      const valueAtRisk99 = this.calculateVaR(returns, 0.99);

      // Calculate Expected Shortfall
      const expectedShortfall95 = this.calculateExpectedShortfall(returns, 0.95);
      const expectedShortfall99 = this.calculateExpectedShortfall(returns, 0.99);

      // Calculate beta
      const marketReturns = await this.getMarketReturns('1Y');
      const portfolioReturns = returns;
      const beta = this.calculateBeta(portfolioReturns, marketReturns);

      // Calculate correlation matrix
      const correlationMatrix = await this.calculateCorrelationMatrix(positions);

      // Stress test scenarios
      const stressTestResults = await this.performStressTests(portfolioId);

      return {
        portfolio_id: portfolioId,
        value_at_risk_95: valueAtRisk95,
        value_at_risk_99: valueAtRisk99,
        expected_shortfall_95: expectedShortfall95,
        expected_shortfall_99: expectedShortfall99,
        beta: beta,
        correlation_matrix: correlationMatrix,
        stress_test_results: stressTestResults,
        calculated_at: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error calculating risk metrics:', error);
      throw new AppError('Failed to calculate risk metrics', 500);
    }
  }

  // Diversification Analysis
  async calculateDiversificationAnalysis(portfolioId: number): Promise<DiversificationAnalysis> {
    try {
      const positions = await this.getCurrentPositions(portfolioId);
      const totalValue = positions.reduce((sum, pos) => sum + (pos.market_value || 0), 0);

      if (totalValue === 0) {
        throw new AppError('Portfolio has no value for diversification analysis', 400);
      }

      // Get sector and geographic data from analysis engine
      const sectorData = await this.getSectorAllocations(positions);
      const geographicData = await this.getGeographicAllocations(positions);

      // Calculate concentration risk
      const sortedPositions = positions
        .filter(p => p.market_value)
        .sort((a, b) => (b.market_value || 0) - (a.market_value || 0));

      const top10Value = sortedPositions
        .slice(0, 10)
        .reduce((sum, pos) => sum + (pos.market_value || 0), 0);

      const top10Percentage = top10Value / totalValue;

      // Calculate Herfindahl index
      const herfindahlIndex = positions
        .filter(p => p.market_value)
        .reduce((sum, pos) => {
          const weight = (pos.market_value || 0) / totalValue;
          return sum + weight * weight;
        }, 0);

      // Calculate correlation matrix
      const correlationMatrix = await this.calculateCorrelationMatrix(positions);

      // Calculate diversification score (0-100)
      const diversificationScore = this.calculateDiversificationScore(
        positions.length,
        herfindahlIndex,
        correlationMatrix
      );

      return {
        portfolio_id: portfolioId,
        sector_allocation: sectorData,
        asset_class_allocation: this.calculateAssetClassAllocation(positions),
        geographic_allocation: geographicData,
        concentration_risk: {
          top_10_holdings_percentage: top10Percentage,
          herfindahl_index: herfindahlIndex,
        },
        correlation_matrix: correlationMatrix,
        diversification_score: diversificationScore,
        calculated_at: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error calculating diversification analysis:', error);
      throw new AppError('Failed to calculate diversification analysis', 500);
    }
  }

  // Colombian Tax Calculations
  async calculateTaxes(portfolioId: number, year: number): Promise<TaxCalculation> {
    try {
      // Get all transactions for the year
      const transactions = await this.getTransactionsForYear(portfolioId, year);

      let capitalGainsTax = 0;
      let ivaTax = 0;
      let trmImpact = 0;
      const taxDetails: any[] = [];

      for (const transaction of transactions) {
        // Calculate capital gains tax (simplified - 10% on gains over UVT threshold)
        if (transaction.transaction_type === 'SELL') {
          const gain = await this.calculateCapitalGain(portfolioId, transaction);
          if (gain > 0) {
            const tax = gain * 0.1; // 10% capital gains tax
            capitalGainsTax += tax;
            taxDetails.push({
              symbol: transaction.symbol,
              transaction_type: transaction.transaction_type,
              quantity: transaction.quantity,
              price: transaction.price,
              gain_loss: gain,
              tax_amount: tax,
              tax_type: 'CAPITAL_GAINS',
              transaction_date: transaction.transaction_date,
            });
          }
        }

        // Calculate IVA (19% on broker fees and certain transactions)
        const ivaAmount = transaction.fees * 0.19;
        ivaTax += ivaAmount;

        // Calculate TRM impact (currency exchange effects)
        const trmEffect = await this.calculateTRMImpact(transaction);
        trmImpact += trmEffect;
      }

      const totalTaxLiability = capitalGainsTax + ivaTax + trmImpact;
      const portfolioValue = await this.getPortfolioValueAtYearEnd(portfolioId, year);
      const effectiveTaxRate = portfolioValue > 0 ? totalTaxLiability / portfolioValue : 0;
      const taxEfficiencyScore = Math.max(0, 100 - (effectiveTaxRate * 100));

      return {
        portfolio_id: portfolioId,
        year: year,
        capital_gains_tax: capitalGainsTax,
        iva_tax: ivaTax,
        trm_impact: trmImpact,
        total_tax_liability: totalTaxLiability,
        effective_tax_rate: effectiveTaxRate,
        tax_efficiency_score: taxEfficiencyScore,
        details: taxDetails,
        calculated_at: new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error calculating taxes:', error);
      throw new AppError('Failed to calculate taxes', 500);
    }
  }

  // Helper methods
  private async getHistoricalPortfolioValues(portfolioId: number, period: string): Promise<HistoricalPerformance[]> {
    // This would typically come from a time-series database
    // For now, we'll reconstruct from transactions
    const transactions = await this.getAllTransactions(portfolioId);
    const endDate = new Date();
    const startDate = this.getStartDateForPeriod(period);

    const dailyValues: HistoricalPerformance[] = [];
    let currentValue = 0;

    // Simplified reconstruction - in reality, this would be stored
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Calculate portfolio value for this date
      currentValue = await this.calculatePortfolioValueAtDate(portfolioId, new Date(date));
      dailyValues.push({
        date: new Date(date),
        value: currentValue,
        return: 0, // Would calculate day-over-day return
        cumulative_return: 0, // Would calculate from start
      });
    }

    return dailyValues;
  }

  private calculateReturns(historicalData: HistoricalPerformance[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const prevValue = historicalData[i - 1].value;
      const currentValue = historicalData[i].value;
      const dailyReturn = prevValue > 0 ? (currentValue - prevValue) / prevValue : 0;
      returns.push(dailyReturn);
    }
    return returns;
  }

  private calculateTotalReturn(historicalData: HistoricalPerformance[]): number {
    if (historicalData.length < 2) return 0;
    const startValue = historicalData[0].value;
    const endValue = historicalData[historicalData.length - 1].value;
    return startValue > 0 ? (endValue - startValue) / startValue : 0;
  }

  private calculateAnnualizedReturn(totalReturn: number, period: string): number {
    const years = this.getYearsFromPeriod(period);
    return years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(historicalData: HistoricalPerformance[]): number {
    let maxDrawdown = 0;
    let peak = historicalData[0].value;

    for (const data of historicalData) {
      if (data.value > peak) {
        peak = data.value;
      }
      const drawdown = (peak - data.value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return -maxDrawdown; // Negative to indicate loss
  }

  private calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
    if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) return 1;

    const portfolioMean = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const marketMean = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < portfolioReturns.length; i++) {
      covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
      marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }

    return marketVariance > 0 ? covariance / marketVariance : 1;
  }

  private calculateTrackingError(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length !== benchmarkReturns.length) return 0;

    const differences = returns.map((r, i) => r - benchmarkReturns[i]);
    const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
    const variance = differences.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / differences.length;

    return Math.sqrt(variance);
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return -sortedReturns[index]; // VaR is positive for loss
  }

  private calculateExpectedShortfall(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index + 1);
    return -tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
  }

  private async calculateCorrelationMatrix(positions: PositionWithDetails[]): Promise<Record<string, Record<string, number>>> {
    const symbols = positions.map(p => p.symbol);
    const correlationMatrix: Record<string, Record<string, number>> = {};

    // Get historical prices for each symbol
    const historicalPrices = await this.getHistoricalPrices(symbols, '1Y');

    for (const symbol1 of symbols) {
      correlationMatrix[symbol1] = {};
      for (const symbol2 of symbols) {
        if (symbol1 === symbol2) {
          correlationMatrix[symbol1][symbol2] = 1;
        } else {
          const returns1 = this.calculateReturns(historicalPrices[symbol1] || []);
          const returns2 = this.calculateReturns(historicalPrices[symbol2] || []);
          correlationMatrix[symbol1][symbol2] = this.calculateCorrelation(returns1, returns2);
        }
      }
    }

    return correlationMatrix;
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length === 0) return 0;

    const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < returns1.length; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      covariance += diff1 * diff2;
      variance1 += diff1 * diff1;
      variance2 += diff2 * diff2;
    }

    return variance1 > 0 && variance2 > 0 ? covariance / Math.sqrt(variance1 * variance2) : 0;
  }

  private calculateDiversificationScore(numAssets: number, herfindahlIndex: number, correlationMatrix: Record<string, Record<string, number>>): number {
    // Simplified diversification score
    const assetCountScore = Math.min(100, numAssets * 10); // Max 100 for 10+ assets
    const concentrationScore = Math.max(0, 100 - herfindahlIndex * 100); // Lower concentration is better

    // Average correlation (lower is better for diversification)
    const correlations = Object.values(correlationMatrix).flatMap(row => Object.values(row));
    const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
    const correlationScore = Math.max(0, 100 - Math.abs(avgCorrelation) * 100);

    return (assetCountScore + concentrationScore + correlationScore) / 3;
  }

  // Placeholder methods - would need implementation based on actual data sources
  private async getMarketReturns(period: string): Promise<number[]> {
    // Would fetch market index returns
    return [0.01, 0.02, -0.01, 0.015]; // Mock data
  }

  private async getCurrentPositions(portfolioId: number): Promise<PositionWithDetails[]> {
    const result = await pool.query('SELECT * FROM positions WHERE portfolio_id = $1', [portfolioId]);
    return result.rows;
  }

  private async getAllTransactions(portfolioId: number): Promise<Transaction[]> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE portfolio_id = $1 ORDER BY transaction_date',
      [portfolioId]
    );
    return result.rows;
  }

  private async getTransactionsForYear(portfolioId: number, year: number): Promise<Transaction[]> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE portfolio_id = $1 AND EXTRACT(year FROM transaction_date) = $2',
      [portfolioId, year]
    );
    return result.rows;
  }

  private async calculatePortfolioValueAtDate(portfolioId: number, date: Date): Promise<number> {
    // Simplified - would need historical position reconstruction
    return 100000; // Mock value
  }

  private getStartDateForPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1D': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1W': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1M': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3M': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '6M': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case '1Y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
  }

  private getYearsFromPeriod(period: string): number {
    switch (period) {
      case '1D': return 1/365;
      case '1W': return 7/365;
      case '1M': return 30/365;
      case '3M': return 90/365;
      case '6M': return 180/365;
      case '1Y': return 1;
      default: return 1;
    }
  }

  private async getSectorAllocations(positions: PositionWithDetails[]): Promise<Record<string, number>> {
    // Would integrate with analysis engine to get sector data
    return { 'Technology': 0.4, 'Healthcare': 0.3, 'Financials': 0.3 }; // Mock
  }

  private async getGeographicAllocations(positions: PositionWithDetails[]): Promise<Record<string, number>> {
    // Would integrate with analysis engine
    return { 'United States': 0.6, 'Colombia': 0.4 }; // Mock
  }

  private calculateAssetClassAllocation(positions: PositionWithDetails[]): Record<string, number> {
    // Simplified asset class allocation
    return { 'Stocks': 0.9, 'Bonds': 0.1 }; // Mock
  }

  private async performStressTests(portfolioId: number): Promise<any[]> {
    // Would implement various stress test scenarios
    return [
      { scenario: 'Market Crash -30%', loss_percentage: 0.25, portfolio_value_after: 75000 },
      { scenario: 'Interest Rate Hike +2%', loss_percentage: 0.05, portfolio_value_after: 95000 },
    ]; // Mock
  }

  private async calculateCapitalGain(portfolioId: number, transaction: Transaction): Promise<number> {
    // Simplified capital gain calculation
    return (transaction.price - 100) * transaction.quantity; // Mock
  }

  private async calculateTRMImpact(transaction: Transaction): Promise<number> {
    // Would calculate currency exchange impact
    return 0; // Mock
  }

  private async getPortfolioValueAtYearEnd(portfolioId: number, year: number): Promise<number> {
    return 100000; // Mock
  }

  private async getHistoricalPrices(symbols: string[], period: string): Promise<Record<string, HistoricalPerformance[]>> {
    // Would fetch historical prices from market data service
    const result: Record<string, HistoricalPerformance[]> = {};
    for (const symbol of symbols) {
      result[symbol] = []; // Mock empty arrays
    }
    return result;
  }
}

export default new AnalyticsService();