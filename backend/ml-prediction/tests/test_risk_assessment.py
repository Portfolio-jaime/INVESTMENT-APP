"""Unit tests for risk assessment and portfolio analysis services."""

import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from app.services.risk_assessment import RiskMetrics


class TestRiskMetrics:
    """Test risk metrics calculation service."""

    @pytest.fixture
    def risk_service(self):
        """Create risk metrics service instance."""
        return RiskMetrics()

    @pytest.fixture
    def sample_portfolio(self):
        """Sample portfolio for testing."""
        return {
            'total_value': 100000,
            'holdings': [
                {'symbol': 'AAPL', 'weight': 0.4, 'value': 40000, 'sector': 'technology', 'volatility': 0.25},
                {'symbol': 'MSFT', 'weight': 0.3, 'value': 30000, 'sector': 'technology', 'volatility': 0.22},
                {'symbol': 'JPM', 'weight': 0.2, 'value': 20000, 'sector': 'financial', 'volatility': 0.30},
                {'symbol': 'KO', 'weight': 0.1, 'value': 10000, 'sector': 'consumer', 'volatility': 0.18}
            ]
        }

    @pytest.fixture
    def sample_historical_data(self):
        """Sample historical data for testing."""
        dates = pd.date_range('2023-01-01', periods=100, freq='D')
        data = {}
        for symbol in ['AAPL', 'MSFT', 'JPM', 'KO']:
            # Generate random returns with some correlation
            returns = np.random.normal(0.0001, 0.02, 100)
            prices = 100 * np.cumprod(1 + returns)
            data[symbol] = pd.DataFrame({'close': prices}, index=dates)

        return data

    @pytest.mark.asyncio
    async def test_calculate_portfolio_risk_historical(self, risk_service, sample_portfolio, sample_historical_data):
        """Test portfolio risk calculation with historical data."""
        metrics = await risk_service.calculate_portfolio_risk(sample_portfolio, sample_historical_data)

        assert 'volatility' in metrics
        assert 'value_at_risk' in metrics
        assert 'sharpe_ratio' in metrics
        assert 'maximum_drawdown' in metrics
        assert 'calculation_method' in metrics
        assert metrics['calculation_method'] == 'historical'

        # Check volatility structure
        assert 'daily' in metrics['volatility']
        assert 'annual' in metrics['volatility']
        assert metrics['volatility']['annual'] > 0

        # Check VaR structure
        var = metrics['value_at_risk']
        assert 'var_95' in var
        assert 'var_99' in var
        assert var['var_95'] < var['var_99']  # 95% VaR should be less negative than 99%

    @pytest.mark.asyncio
    async def test_calculate_portfolio_risk_estimated(self, risk_service, sample_portfolio):
        """Test portfolio risk calculation with estimated parameters."""
        metrics = await risk_service.calculate_portfolio_risk(sample_portfolio)

        assert 'volatility' in metrics
        assert 'value_at_risk' in metrics
        assert 'calculation_method' in metrics
        assert metrics['calculation_method'] == 'estimated'

        # Check that we get reasonable values
        assert metrics['volatility']['daily'] > 0
        assert metrics['volatility']['annual'] > 0

    @pytest.mark.asyncio
    async def test_calculate_portfolio_risk_empty_portfolio(self, risk_service):
        """Test portfolio risk calculation with empty portfolio."""
        empty_portfolio = {'holdings': []}
        metrics = await risk_service.calculate_portfolio_risk(empty_portfolio)

        assert 'error' in metrics
        assert 'Unable to calculate' in metrics['error']

    @pytest.mark.asyncio
    async def test_calculate_security_risk(self, risk_service):
        """Test individual security risk calculation."""
        historical_prices = [100, 102, 98, 105, 103, 107, 110, 108, 112, 115]
        current_price = 115

        metrics = await risk_service.calculate_security_risk('AAPL', historical_prices, current_price)

        assert metrics['symbol'] == 'AAPL'
        assert 'volatility' in metrics
        assert 'value_at_risk' in metrics
        assert 'sharpe_ratio' in metrics
        assert 'maximum_drawdown' in metrics
        assert 'beta' in metrics
        assert 'distribution' in metrics
        assert 'liquidity_risk' in metrics
        assert 'credit_risk' in metrics

        # Check volatility calculations
        assert metrics['volatility']['daily'] > 0
        assert metrics['volatility']['annual'] > 0

    @pytest.mark.asyncio
    async def test_calculate_security_risk_insufficient_data(self, risk_service):
        """Test security risk calculation with insufficient data."""
        historical_prices = [100, 102]  # Only 2 data points
        current_price = 102

        metrics = await risk_service.calculate_security_risk('AAPL', historical_prices, current_price)

        assert 'error' in metrics
        assert 'Unable to calculate' in metrics['error']

    @pytest.mark.asyncio
    async def test_run_stress_tests(self, risk_service, sample_portfolio):
        """Test stress test execution."""
        scenarios = [
            {'name': 'Market Crash', 'type': 'market_wide', 'magnitude': 0.2},
            {'name': 'Tech Sector Drop', 'type': 'sector_specific', 'magnitude': 0.15, 'affected_sectors': ['technology']},
            {'name': 'Currency Crisis', 'type': 'currency', 'magnitude': 0.1}
        ]

        results = await risk_service.run_stress_tests(sample_portfolio, scenarios)

        assert 'portfolio_value' in results
        assert 'scenarios' in results
        assert 'worst_case' in results
        assert 'best_case' in results
        assert 'timestamp' in results

        assert len(results['scenarios']) == 3

        # Check that worst case has highest loss percentage
        worst_loss = results['worst_case']['loss_percentage']
        best_loss = results['best_case']['loss_percentage']
        assert worst_loss >= best_loss

    @pytest.mark.asyncio
    async def test_run_stress_tests_market_wide(self, risk_service, sample_portfolio):
        """Test market-wide stress test scenario."""
        scenario = {'name': 'Market Crash', 'type': 'market_wide', 'magnitude': 0.1}

        results = await risk_service.run_stress_tests(sample_portfolio, [scenario])

        scenario_result = results['scenarios'][0]
        assert scenario_result['scenario_name'] == 'Market Crash'
        assert scenario_result['shock_type'] == 'market_wide'
        assert scenario_result['shock_magnitude'] == 0.1
        assert scenario_result['loss_percentage'] > 0

    @pytest.mark.asyncio
    async def test_run_stress_tests_sector_specific(self, risk_service, sample_portfolio):
        """Test sector-specific stress test scenario."""
        scenario = {
            'name': 'Tech Crash',
            'type': 'sector_specific',
            'magnitude': 0.2,
            'affected_sectors': ['technology']
        }

        results = await risk_service.run_stress_tests(sample_portfolio, [scenario])

        scenario_result = results['scenarios'][0]
        assert scenario_result['scenario_name'] == 'Tech Crash'
        assert scenario_result['shock_type'] == 'sector_specific'
        assert scenario_result['affected_holdings'] > 0  # Should affect tech stocks

    @pytest.mark.asyncio
    async def test_run_stress_tests_colombian_currency(self, risk_service, sample_portfolio):
        """Test Colombian currency stress test scenario."""
        # Add a Colombian stock to portfolio
        colombian_portfolio = sample_portfolio.copy()
        colombian_portfolio['holdings'].append({
            'symbol': 'ECOPETROL.CB',
            'weight': 0.1,
            'value': 10000,
            'sector': 'energy',
            'volatility': 0.35
        })

        scenario = {'name': 'COP Crisis', 'type': 'currency', 'magnitude': 0.15}

        results = await risk_service.run_stress_tests(colombian_portfolio, [scenario])

        scenario_result = results['scenarios'][0]
        assert scenario_result['scenario_name'] == 'COP Crisis'
        assert scenario_result['shock_type'] == 'currency'
        assert scenario_result['affected_holdings'] >= 1  # Should affect Colombian stocks

    def test_build_returns_matrix(self, risk_service, sample_historical_data):
        """Test building returns matrix from historical data."""
        holdings = [
            {'symbol': 'AAPL'},
            {'symbol': 'MSFT'},
            {'symbol': 'JPM'}
        ]

        returns_matrix = risk_service._build_returns_matrix(holdings, sample_historical_data)

        assert returns_matrix.shape[0] == len(holdings)  # Number of assets
        assert returns_matrix.shape[1] > 0  # Number of periods

    def test_calculate_historical_risk_metrics(self, risk_service):
        """Test historical risk metrics calculation."""
        # Create sample returns matrix (3 assets, 100 periods)
        np.random.seed(42)
        returns_matrix = np.random.normal(0.0001, 0.02, (3, 100))
        weights = np.array([0.5, 0.3, 0.2])

        metrics = risk_service._calculate_historical_risk_metrics(returns_matrix, weights)

        assert 'volatility' in metrics
        assert 'value_at_risk' in metrics
        assert 'sharpe_ratio' in metrics
        assert 'maximum_drawdown' in metrics
        assert metrics['calculation_method'] == 'historical'

    def test_calculate_estimated_risk_metrics(self, risk_service):
        """Test estimated risk metrics calculation."""
        weights = np.array([0.4, 0.3, 0.2, 0.1])
        volatilities = [0.25, 0.22, 0.30, 0.18]
        correlations = np.array([
            [1.0, 0.7, 0.3, 0.2],
            [0.7, 1.0, 0.4, 0.3],
            [0.3, 0.4, 1.0, 0.5],
            [0.2, 0.3, 0.5, 1.0]
        ])

        metrics = risk_service._calculate_estimated_risk_metrics(weights, volatilities, correlations)

        assert 'volatility' in metrics
        assert 'value_at_risk' in metrics
        assert metrics['calculation_method'] == 'estimated'

    def test_calculate_additional_risk_measures(self, risk_service, sample_portfolio):
        """Test additional risk measures calculation."""
        base_metrics = {'volatility': {'daily': 0.015}}

        additional = risk_service._calculate_additional_risk_measures(sample_portfolio, base_metrics)

        assert 'concentration' in additional
        assert 'liquidity' in additional
        assert 'diversification_score' in additional

        # Check concentration metrics
        concentration = additional['concentration']
        assert 'herfindahl_index' in concentration
        assert 'max_sector_weight' in concentration
        assert concentration['max_sector_weight'] > 0  # Tech sector should be highest

    def test_estimate_correlations(self, risk_service, sample_portfolio):
        """Test correlation matrix estimation."""
        holdings = sample_portfolio['holdings']

        correlation_matrix = risk_service._estimate_correlations(holdings)

        assert correlation_matrix.shape == (len(holdings), len(holdings))
        assert np.allclose(correlation_matrix, correlation_matrix.T)  # Should be symmetric
        assert np.all(np.diag(correlation_matrix) == 1.0)  # Diagonal should be 1

    def test_test_normality(self, risk_service):
        """Test normality testing of returns."""
        # Normal data
        normal_returns = np.random.normal(0, 0.02, 1000)
        is_normal = risk_service._test_normality(normal_returns)
        assert isinstance(is_normal, bool)

        # Non-normal data (heavy tails)
        heavy_tail_returns = np.random.standard_t(3, 1000) * 0.02
        is_normal_heavy = risk_service._test_normality(heavy_tail_returns)
        assert isinstance(is_normal_heavy, bool)

    def test_assess_liquidity_risk(self, risk_service):
        """Test liquidity risk assessment."""
        liquidity = risk_service._assess_liquidity_risk('AAPL', [100, 102, 98, 105])

        assert 'liquidity_score' in liquidity
        assert 'risk_level' in liquidity
        assert 'average_volume' in liquidity
        assert liquidity['risk_level'] in ['low', 'medium', 'high']

    def test_assess_credit_risk(self, risk_service):
        """Test credit risk assessment."""
        # International stock
        credit_intl = risk_service._assess_credit_risk('AAPL')
        assert credit_intl['risk_level'] == 'low'
        assert credit_intl['credit_score'] == 85

        # Colombian stock
        credit_col = risk_service._assess_credit_risk('ECOPETROL.CB')
        assert credit_col['risk_level'] == 'medium'
        assert credit_col['credit_score'] == 70

    def test_calculate_diversification_score(self, risk_service):
        """Test diversification score calculation."""
        # Well diversified portfolio
        diversified_holdings = [
            {'sector': 'technology'},
            {'sector': 'financial'},
            {'sector': 'consumer'},
            {'sector': 'healthcare'},
            {'sector': 'energy'}
        ] * 4  # 20 holdings, 5 sectors

        score = risk_service._calculate_diversification_score(diversified_holdings)
        assert 80 <= score <= 100  # Should be high

        # Poorly diversified portfolio
        concentrated_holdings = [
            {'sector': 'technology'}
        ] * 10  # 10 holdings, 1 sector

        score_concentrated = risk_service._calculate_diversification_score(concentrated_holdings)
        assert score_concentrated < score  # Should be lower

    def test_estimate_recovery_time(self, risk_service):
        """Test recovery time estimation."""
        assert risk_service._estimate_recovery_time(5) == "1-3 months"
        assert risk_service._estimate_recovery_time(20) == "6-12 months"
        assert risk_service._estimate_recovery_time(40) == "1-2 years"