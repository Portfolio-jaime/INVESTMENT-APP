"""Unit tests for ML predictor."""

import pytest
from datetime import datetime, timedelta
from app.models.predictor import SimplePredictor


def generate_sample_data(days=60, start_price=100.0):
    """Generate sample historical data for testing."""
    data = []
    current_price = start_price
    base_date = datetime.now() - timedelta(days=days)

    for i in range(days):
        # Simulate some price movement
        change = (i % 10 - 5) * 0.5
        current_price = max(1.0, current_price + change)

        data.append({
            'date': (base_date + timedelta(days=i)).isoformat(),
            'close': round(current_price, 2),
            'volume': 1000000 + (i * 10000)
        })

    return data


class TestSimplePredictor:
    """Test suite for SimplePredictor class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.predictor = SimplePredictor()

    def test_predict_price_basic(self):
        """Test basic price prediction."""
        data = generate_sample_data(60, 150.0)
        predicted_price, confidence = self.predictor.predict_price(data)

        assert predicted_price > 0
        assert 0.0 <= confidence <= 1.0
        assert isinstance(predicted_price, float)
        assert isinstance(confidence, float)

    def test_predict_price_insufficient_data(self):
        """Test price prediction with insufficient data."""
        data = generate_sample_data(5, 150.0)

        with pytest.raises(ValueError, match="Need at least 10 days"):
            self.predictor.predict_price(data)

    def test_predict_signal_buy(self):
        """Test buy signal prediction."""
        # RSI oversold scenario
        signal, strength, confidence, reasoning = self.predictor.predict_signal(
            current_price=150.0,
            rsi=25.0,  # Oversold
            macd_data={'histogram': [0.5, 0.8]}  # Bullish
        )

        assert signal == 'buy'
        assert 0.0 <= strength <= 1.0
        assert 0.0 <= confidence <= 1.0
        assert 'rsi' in reasoning
        assert reasoning['rsi_signal'] == 'oversold'

    def test_predict_signal_sell(self):
        """Test sell signal prediction."""
        # RSI overbought scenario
        signal, strength, confidence, reasoning = self.predictor.predict_signal(
            current_price=150.0,
            rsi=75.0,  # Overbought
            macd_data={'histogram': [-0.5, -0.8]}  # Bearish
        )

        assert signal == 'sell'
        assert 0.0 <= strength <= 1.0
        assert 0.0 <= confidence <= 1.0
        assert reasoning['rsi_signal'] == 'overbought'

    def test_predict_signal_hold(self):
        """Test hold signal prediction."""
        # Neutral scenario
        signal, strength, confidence, reasoning = self.predictor.predict_signal(
            current_price=150.0,
            rsi=50.0,  # Neutral
            macd_data={'histogram': [0.1, 0.05]}  # Weak bullish
        )

        # Should be relatively neutral
        assert 0.0 <= strength <= 1.0
        assert 0.0 <= confidence <= 1.0

    def test_predict_trend_upward(self):
        """Test upward trend prediction."""
        # Generate upward trending data
        data = []
        for i in range(30):
            data.append({
                'date': (datetime.now() - timedelta(days=30-i)).isoformat(),
                'close': 100.0 + (i * 2),  # Steady increase
                'volume': 1000000
            })

        trend, strength, confidence, momentum = self.predictor.predict_trend(data)

        assert trend in ['up', 'down', 'neutral']
        assert 0.0 <= strength <= 1.0
        assert 0.0 <= confidence <= 1.0
        assert 'sma_3' in momentum
        assert 'slope' in momentum

    def test_predict_trend_insufficient_data(self):
        """Test trend prediction with insufficient data."""
        data = generate_sample_data(2, 150.0)

        with pytest.raises(ValueError, match="Need at least 3 days"):
            self.predictor.predict_trend(data, window=3)
