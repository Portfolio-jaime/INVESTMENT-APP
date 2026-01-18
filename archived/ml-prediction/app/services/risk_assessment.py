"""Risk assessment and portfolio analysis services."""

from typing import List, Dict, Any, Optional, Tuple
import structlog
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from scipy import stats

from app.core.config import settings

logger = structlog.get_logger()


class RiskMetrics:
    """Portfolio and security risk metrics."""

    def __init__(self):
        self.risk_free_rate = settings.RISK_FREE_RATE

    async def calculate_portfolio_risk(self, portfolio: Dict[str, Any], historical_data: Optional[Dict[str, pd.DataFrame]] = None) -> Dict[str, Any]:
        """
        Calculate comprehensive portfolio risk metrics.

        Args:
            portfolio: Portfolio composition with holdings
            historical_data: Historical price data for holdings

        Returns:
            Dictionary with risk metrics
        """

        holdings = portfolio.get('holdings', [])
        if not holdings:
            return self._empty_portfolio_metrics()

        try:
            # Extract portfolio weights and returns
            weights = np.array([holding.get('weight', 0) for holding in holdings])
            weights = weights / weights.sum()  # Normalize

            if historical_data:
                # Calculate from historical data
                returns_matrix = self._build_returns_matrix(holdings, historical_data)
                metrics = self._calculate_historical_risk_metrics(returns_matrix, weights)
            else:
                # Calculate from individual security metrics
                individual_volatilities = [holding.get('volatility', 0.15) for holding in holdings]
                correlations = self._estimate_correlations(holdings)

                metrics = self._calculate_estimated_risk_metrics(weights, individual_volatilities, correlations)

            # Add additional risk measures
            metrics.update(self._calculate_additional_risk_measures(portfolio, metrics))

            return metrics

        except Exception as e:
            logger.error("Failed to calculate portfolio risk", error=str(e))
            return self._empty_portfolio_metrics()

    async def calculate_security_risk(self, symbol: str, historical_prices: List[float], current_price: float) -> Dict[str, Any]:
        """
        Calculate individual security risk metrics.

        Args:
            symbol: Security symbol
            historical_prices: Historical price data
            current_price: Current price

        Returns:
            Dictionary with security risk metrics
        """

        if not historical_prices or len(historical_prices) < 30:
            return self._empty_security_metrics(symbol)

        try:
            prices = np.array(historical_prices)
            returns = np.diff(prices) / prices[:-1]

            # Basic volatility measures
            daily_volatility = np.std(returns)
            annual_volatility = daily_volatility * np.sqrt(252)  # Trading days per year

            # Value at Risk (VaR)
            var_95 = np.percentile(returns, 5)  # 95% confidence
            var_99 = np.percentile(returns, 1)  # 99% confidence

            # Expected Shortfall (ES) - Conditional VaR
            es_95 = np.mean(returns[returns <= var_95])
            es_99 = np.mean(returns[returns <= var_99])

            # Sharpe Ratio (if we have risk-free rate data)
            avg_return = np.mean(returns)
            sharpe_ratio = (avg_return - self.risk_free_rate / 252) / daily_volatility if daily_volatility > 0 else 0

            # Maximum Drawdown
            cumulative = np.cumprod(1 + returns)
            running_max = np.maximum.accumulate(cumulative)
            drawdown = (cumulative - running_max) / running_max
            max_drawdown = np.min(drawdown)

            # Beta (relative to market - simplified, would need market data)
            market_returns = self._estimate_market_returns(returns)  # Simplified
            beta = np.cov(returns, market_returns)[0, 1] / np.var(market_returns) if np.var(market_returns) > 0 else 1.0

            # Skewness and Kurtosis
            skewness = stats.skew(returns)
            kurtosis = stats.kurtosis(returns)

            return {
                "symbol": symbol,
                "volatility": {
                    "daily": float(daily_volatility),
                    "annual": float(annual_volatility)
                },
                "value_at_risk": {
                    "var_95": float(var_95),
                    "var_99": float(var_99),
                    "es_95": float(es_95),
                    "es_99": float(es_99)
                },
                "sharpe_ratio": float(sharpe_ratio),
                "maximum_drawdown": float(max_drawdown),
                "beta": float(beta),
                "distribution": {
                    "skewness": float(skewness),
                    "kurtosis": float(kurtosis),
                    "is_normal": self._test_normality(returns)
                },
                "liquidity_risk": self._assess_liquidity_risk(symbol, historical_prices),
                "credit_risk": self._assess_credit_risk(symbol),
                "concentration_risk": self._assess_concentration_risk(symbol, portfolio_context=None)
            }

        except Exception as e:
            logger.error("Failed to calculate security risk", symbol=symbol, error=str(e))
            return self._empty_security_metrics(symbol)

    async def run_stress_tests(self, portfolio: Dict[str, Any], scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run stress tests on portfolio under various scenarios.

        Args:
            portfolio: Portfolio composition
            scenarios: List of stress test scenarios

        Returns:
            Stress test results
        """

        results = {
            "portfolio_value": portfolio.get('total_value', 0),
            "scenarios": [],
            "worst_case": None,
            "best_case": None,
            "timestamp": datetime.utcnow()
        }

        holdings = portfolio.get('holdings', [])

        for scenario in scenarios:
            scenario_result = await self._run_single_stress_test(holdings, scenario)
            results["scenarios"].append(scenario_result)

            # Track worst and best cases
            if results["worst_case"] is None or scenario_result["loss_percentage"] > results["worst_case"]["loss_percentage"]:
                results["worst_case"] = scenario_result

            if results["best_case"] is None or scenario_result["loss_percentage"] < results["best_case"]["loss_percentage"]:
                results["best_case"] = scenario_result

        return results

    async def _run_single_stress_test(self, holdings: List[Dict[str, Any]], scenario: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single stress test scenario."""

        scenario_name = scenario.get('name', 'Unnamed Scenario')
        shock_type = scenario.get('type', 'market_wide')
        shock_magnitude = scenario.get('magnitude', 0.1)  # 10% shock

        total_loss = 0
        affected_holdings = 0

        for holding in holdings:
            symbol = holding.get('symbol', '')
            weight = holding.get('weight', 0)
            value = holding.get('value', 0)

            # Apply scenario-specific shock
            if shock_type == 'market_wide':
                loss = value * shock_magnitude
            elif shock_type == 'sector_specific':
                sector = holding.get('sector', '')
                if sector in scenario.get('affected_sectors', []):
                    loss = value * shock_magnitude
                else:
                    loss = 0
            elif shock_type == 'currency':
                # Colombian peso specific
                if symbol.endswith('.CB'):  # Colombian stocks
                    loss = value * shock_magnitude
                else:
                    loss = 0
            else:
                loss = value * shock_magnitude

            total_loss += loss
            if loss > 0:
                affected_holdings += 1

        portfolio_value = sum(h['value'] for h in holdings)
        loss_percentage = (total_loss / portfolio_value) * 100 if portfolio_value > 0 else 0

        return {
            "scenario_name": scenario_name,
            "shock_type": shock_type,
            "shock_magnitude": shock_magnitude,
            "total_loss": float(total_loss),
            "loss_percentage": float(loss_percentage),
            "affected_holdings": affected_holdings,
            "recovery_time_estimate": self._estimate_recovery_time(loss_percentage)
        }

    def _build_returns_matrix(self, holdings: List[Dict[str, Any]], historical_data: Dict[str, pd.DataFrame]) -> np.ndarray:
        """Build matrix of historical returns for portfolio holdings."""
        returns_list = []

        for holding in holdings:
            symbol = holding.get('symbol', '')
            if symbol in historical_data:
                prices = historical_data[symbol]['close'].values
                returns = np.diff(prices) / prices[:-1]
                returns_list.append(returns)

        if not returns_list:
            # Return random correlated returns as fallback
            n_assets = len(holdings)
            n_periods = 252  # One year
            returns_matrix = np.random.multivariate_normal(
                mean=np.zeros(n_assets),
                cov=self._generate_random_correlation_matrix(n_assets),
                size=n_periods
            )
            return returns_matrix

        # Pad shorter series to match longest
        max_length = max(len(r) for r in returns_list)
        padded_returns = []

        for returns in returns_list:
            if len(returns) < max_length:
                # Pad with zeros (simplified)
                padding = np.zeros(max_length - len(returns))
                padded_returns.append(np.concatenate([padding, returns]))
            else:
                padded_returns.append(returns)

        return np.column_stack(padded_returns)

    def _calculate_historical_risk_metrics(self, returns_matrix: np.ndarray, weights: np.ndarray) -> Dict[str, Any]:
        """Calculate risk metrics from historical returns."""

        # Portfolio returns
        portfolio_returns = np.dot(returns_matrix, weights)

        # Volatility
        portfolio_volatility = np.std(portfolio_returns)
        annual_volatility = portfolio_volatility * np.sqrt(252)

        # VaR and ES
        var_95 = np.percentile(portfolio_returns, 5)
        var_99 = np.percentile(portfolio_returns, 1)
        es_95 = np.mean(portfolio_returns[portfolio_returns <= var_95])
        es_99 = np.mean(portfolio_returns[portfolio_returns <= var_99])

        # Sharpe ratio
        avg_return = np.mean(portfolio_returns)
        sharpe_ratio = (avg_return - self.risk_free_rate / 252) / portfolio_volatility if portfolio_volatility > 0 else 0

        # Maximum drawdown
        cumulative = np.cumprod(1 + portfolio_returns)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = np.min(drawdown)

        return {
            "volatility": {
                "daily": float(portfolio_volatility),
                "annual": float(annual_volatility)
            },
            "value_at_risk": {
                "var_95": float(var_95),
                "var_99": float(var_99),
                "es_95": float(es_95),
                "es_99": float(es_99)
            },
            "sharpe_ratio": float(sharpe_ratio),
            "maximum_drawdown": float(max_drawdown),
            "average_return": float(avg_return),
            "calculation_method": "historical"
        }

    def _calculate_estimated_risk_metrics(self, weights: np.ndarray, volatilities: List[float], correlations: np.ndarray) -> Dict[str, Any]:
        """Calculate risk metrics using estimated parameters."""

        volatilities = np.array(volatilities)

        # Portfolio volatility using correlation matrix
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(correlations, weights)))

        # Annualize
        annual_volatility = portfolio_volatility * np.sqrt(252)

        # Estimate VaR using normal distribution assumption
        var_95 = -stats.norm.ppf(0.05) * portfolio_volatility
        var_99 = -stats.norm.ppf(0.01) * portfolio_volatility

        # Estimate ES (simplified)
        es_95 = -stats.norm.pdf(stats.norm.ppf(0.05)) / 0.05 * portfolio_volatility
        es_99 = -stats.norm.pdf(stats.norm.ppf(0.01)) / 0.01 * portfolio_volatility

        return {
            "volatility": {
                "daily": float(portfolio_volatility),
                "annual": float(annual_volatility)
            },
            "value_at_risk": {
                "var_95": float(var_95),
                "var_99": float(var_99),
                "es_95": float(es_95),
                "es_99": float(es_99)
            },
            "sharpe_ratio": 0.0,  # Cannot calculate without return data
            "maximum_drawdown": 0.0,  # Cannot calculate without historical data
            "calculation_method": "estimated"
        }

    def _calculate_additional_risk_measures(self, portfolio: Dict[str, Any], base_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate additional risk measures."""

        holdings = portfolio.get('holdings', [])

        # Concentration risk
        weights = [h.get('weight', 0) for h in holdings]
        herfindahl_index = sum(w ** 2 for w in weights)  # Concentration measure

        # Sector concentration
        sector_weights = {}
        for holding in holdings:
            sector = holding.get('sector', 'unknown')
            sector_weights[sector] = sector_weights.get(sector, 0) + holding.get('weight', 0)

        max_sector_weight = max(sector_weights.values()) if sector_weights else 0

        # Liquidity risk
        illiquid_positions = sum(1 for h in holdings if h.get('average_volume', 0) < 100000)
        liquidity_score = illiquid_positions / len(holdings) if holdings else 0

        return {
            "concentration": {
                "herfindahl_index": float(herfindahl_index),
                "max_sector_weight": float(max_sector_weight),
                "largest_position": float(max(weights) if weights else 0)
            },
            "liquidity": {
                "illiquid_positions_ratio": float(liquidity_score),
                "average_volume": sum(h.get('average_volume', 0) for h in holdings) / len(holdings) if holdings else 0
            },
            "diversification_score": self._calculate_diversification_score(holdings)
        }

    def _estimate_correlations(self, holdings: List[Dict[str, Any]]) -> np.ndarray:
        """Estimate correlation matrix for holdings."""
        n = len(holdings)

        # Simple correlation estimation based on sectors and geography
        correlation_matrix = np.full((n, n), 0.3)  # Base correlation

        for i in range(n):
            for j in range(n):
                if i == j:
                    correlation_matrix[i, j] = 1.0
                else:
                    holding_i = holdings[i]
                    holding_j = holdings[j]

                    # Same sector = higher correlation
                    if holding_i.get('sector') == holding_j.get('sector'):
                        correlation_matrix[i, j] = 0.7

                    # Colombian market correlation
                    if (holding_i.get('symbol', '').endswith('.CB') and
                        holding_j.get('symbol', '').endswith('.CB')):
                        correlation_matrix[i, j] = min(correlation_matrix[i, j] + 0.2, 0.9)

        return correlation_matrix

    def _generate_random_correlation_matrix(self, n: int) -> np.ndarray:
        """Generate a random correlation matrix for fallback."""
        # Generate random correlations between 0.1 and 0.8
        corr_matrix = np.random.uniform(0.1, 0.8, (n, n))
        corr_matrix = (corr_matrix + corr_matrix.T) / 2  # Make symmetric
        np.fill_diagonal(corr_matrix, 1.0)  # Diagonal = 1
        return corr_matrix

    def _estimate_market_returns(self, returns: np.ndarray) -> np.ndarray:
        """Estimate market returns (simplified)."""
        # In practice, this would use actual market index data
        # For now, assume market returns are similar but with some diversification
        market_volatility = np.std(returns) * 0.8  # Slightly less volatile
        return np.random.normal(0, market_volatility, len(returns))

    def _test_normality(self, returns: np.ndarray) -> bool:
        """Test if returns follow normal distribution."""
        try:
            _, p_value = stats.shapiro(returns[:min(len(returns), 5000)])  # Shapiro-Wilk test
            return p_value > 0.05  # Null hypothesis: data is normal
        except:
            return False

    def _assess_liquidity_risk(self, symbol: str, historical_prices: List[float]) -> Dict[str, Any]:
        """Assess liquidity risk for a security."""
        # Simplified liquidity assessment
        avg_volume = 1000000  # Mock average volume
        price_volatility = np.std(np.diff(historical_prices) / historical_prices[:-1]) if len(historical_prices) > 1 else 0

        liquidity_score = min(avg_volume / 1000000, 1.0)  # Normalize
        liquidity_risk = "low" if liquidity_score > 0.7 else "medium" if liquidity_score > 0.3 else "high"

        return {
            "liquidity_score": float(liquidity_score),
            "risk_level": liquidity_risk,
            "average_volume": avg_volume,
            "bid_ask_spread_estimate": float(price_volatility * 0.01)  # Estimate spread
        }

    def _assess_credit_risk(self, symbol: str) -> Dict[str, Any]:
        """Assess credit risk for a security."""
        # Simplified credit risk assessment
        # In practice, this would use credit ratings, financial health metrics, etc.

        if symbol.endswith('.CB'):
            # Colombian stocks - assess based on company fundamentals
            credit_score = 70  # Mock score
            risk_level = "medium"
        else:
            credit_score = 85  # International stocks generally higher rated
            risk_level = "low"

        return {
            "credit_score": credit_score,
            "risk_level": risk_level,
            "rating": "BBB" if credit_score > 60 else "BB"  # Simplified rating
        }

    def _assess_concentration_risk(self, symbol: str, portfolio_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess concentration risk."""
        if not portfolio_context:
            return {"concentration_score": 0.0, "risk_level": "unknown"}

        holdings = portfolio_context.get('holdings', [])
        symbol_weight = 0

        for holding in holdings:
            if holding.get('symbol') == symbol:
                symbol_weight = holding.get('weight', 0)
                break

        concentration_score = symbol_weight
        risk_level = "low" if concentration_score < 0.05 else "medium" if concentration_score < 0.1 else "high"

        return {
            "concentration_score": float(concentration_score),
            "risk_level": risk_level,
            "portfolio_percentage": float(concentration_score * 100)
        }

    def _calculate_diversification_score(self, holdings: List[Dict[str, Any]]) -> float:
        """Calculate portfolio diversification score (0-100)."""
        if not holdings:
            return 0.0

        n_holdings = len(holdings)
        sectors = set(h.get('sector', 'unknown') for h in holdings)
        n_sectors = len(sectors)

        # Base score from number of holdings
        size_score = min(n_holdings / 20, 1.0) * 50  # Max 50 points for size

        # Sector diversification score
        sector_score = min(n_sectors / 10, 1.0) * 30  # Max 30 points for sectors

        # Weight distribution score
        weights = [h.get('weight', 0) for h in holdings]
        if weights:
            max_weight = max(weights)
            concentration_penalty = max(0, (max_weight - 0.1) * 100)  # Penalty for >10% positions
            distribution_score = max(0, 20 - concentration_penalty)  # Max 20 points
        else:
            distribution_score = 0

        return size_score + sector_score + distribution_score

    def _estimate_recovery_time(self, loss_percentage: float) -> str:
        """Estimate recovery time from loss."""
        if loss_percentage < 5:
            return "1-3 months"
        elif loss_percentage < 15:
            return "3-6 months"
        elif loss_percentage < 30:
            return "6-12 months"
        else:
            return "1-2 years"

    def _empty_portfolio_metrics(self) -> Dict[str, Any]:
        """Return empty portfolio metrics."""
        return {
            "volatility": {"daily": 0.0, "annual": 0.0},
            "value_at_risk": {"var_95": 0.0, "var_99": 0.0, "es_95": 0.0, "es_99": 0.0},
            "sharpe_ratio": 0.0,
            "maximum_drawdown": 0.0,
            "concentration": {"herfindahl_index": 0.0, "max_sector_weight": 0.0},
            "liquidity": {"illiquid_positions_ratio": 0.0},
            "diversification_score": 0.0,
            "error": "Unable to calculate portfolio risk metrics"
        }

    def _empty_security_metrics(self, symbol: str) -> Dict[str, Any]:
        """Return empty security metrics."""
        return {
            "symbol": symbol,
            "volatility": {"daily": 0.0, "annual": 0.0},
            "value_at_risk": {"var_95": 0.0, "var_99": 0.0, "es_95": 0.0, "es_99": 0.0},
            "sharpe_ratio": 0.0,
            "maximum_drawdown": 0.0,
            "beta": 1.0,
            "distribution": {"skewness": 0.0, "kurtosis": 0.0, "is_normal": False},
            "liquidity_risk": {"liquidity_score": 0.0, "risk_level": "unknown"},
            "credit_risk": {"credit_score": 0, "risk_level": "unknown"},
            "concentration_risk": {"concentration_score": 0.0, "risk_level": "unknown"},
            "error": "Unable to calculate security risk metrics"
        }


# Global risk assessment service instance
risk_assessment_service = RiskMetrics()