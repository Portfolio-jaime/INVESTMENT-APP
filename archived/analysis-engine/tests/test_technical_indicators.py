"""Tests for technical indicators service."""

import pytest
from unittest.mock import AsyncMock, patch
import pandas as pd
from datetime import datetime

from app.services.technical_indicators import TechnicalIndicatorService
from app.core.exceptions import DataNotFoundError


class TestTechnicalIndicatorService:
    """Test cases for TechnicalIndicatorService."""

    @pytest.fixture
    def service(self):
        """Create a test service instance."""
        return TechnicalIndicatorService()

    @pytest.fixture
    def sample_data(self):
        """Create sample market data."""
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        data = {
            'date': dates,
            'close': [100 + i * 0.1 for i in range(100)],
            'high': [101 + i * 0.1 for i in range(100)],
            'low': [99 + i * 0.1 for i in range(100)],
            'volume': [1000000] * 100
        }
        return data

    @pytest.mark.asyncio
    async def test_calculate_sma_success(self, service, sample_data):
        """Test successful SMA calculation."""
        with patch.object(service, '_fetch_historical_data', return_value=pd.DataFrame(sample_data)) as mock_fetch:
            result = await service.calculate_sma('AAPL', period=20)

            assert result.symbol == 'AAPL'
            assert result.period == 20
            assert len(result.data) > 0
            assert all(isinstance(point.value, float) for point in result.data)

            mock_fetch.assert_called_once()

    @pytest.mark.asyncio
    async def test_calculate_sma_insufficient_data(self, service):
        """Test SMA calculation with insufficient data."""
        sample_df = pd.DataFrame({
            'date': pd.date_range(start='2023-01-01', periods=5, freq='D'),
            'close': [100] * 5
        })

        with patch.object(service, '_fetch_historical_data', return_value=sample_df):
            with pytest.raises(DataNotFoundError):
                await service.calculate_sma('AAPL', period=20)

    @pytest.mark.asyncio
    async def test_calculate_rsi_success(self, service, sample_data):
        """Test successful RSI calculation."""
        with patch.object(service, '_fetch_historical_data', return_value=pd.DataFrame(sample_data)):
            result = await service.calculate_rsi('AAPL', period=14)

            assert result.symbol == 'AAPL'
            assert result.period == 14
            assert len(result.data) > 0
            # RSI should be between 0 and 100
            assert all(0 <= point.value <= 100 for point in result.data)

    @pytest.mark.asyncio
    async def test_calculate_macd_success(self, service, sample_data):
        """Test successful MACD calculation."""
        with patch.object(service, '_fetch_historical_data', return_value=pd.DataFrame(sample_data)):
            result = await service.calculate_macd('AAPL')

            assert result.symbol == 'AAPL'
            assert result.fast_period == 12
            assert result.slow_period == 26
            assert result.signal_period == 9
            assert len(result.data) > 0
            assert all(isinstance(point.macd, float) for point in result.data)
            assert all(isinstance(point.signal, float) for point in result.data)
            assert all(isinstance(point.histogram, float) for point in result.data)

    @pytest.mark.asyncio
    async def test_calculate_bollinger_bands_success(self, service, sample_data):
        """Test successful Bollinger Bands calculation."""
        with patch.object(service, '_fetch_historical_data', return_value=pd.DataFrame(sample_data)):
            result = await service.calculate_bollinger_bands('AAPL')

            assert result.symbol == 'AAPL'
            assert result.period == 20
            assert result.std_dev == 2.0
            assert len(result.data) > 0
            assert all(isinstance(point.upper, float) for point in result.data)
            assert all(isinstance(point.middle, float) for point in result.data)
            assert all(isinstance(point.lower, float) for point in result.data)

    @pytest.mark.asyncio
    async def test_calculate_all_indicators(self, service, sample_data):
        """Test calculation of all indicators."""
        with patch.object(service, '_fetch_historical_data', return_value=pd.DataFrame(sample_data)):
            result = await service.calculate_all_indicators('AAPL')

            assert result.symbol == 'AAPL'
            assert result.sma is not None
            assert result.ema is not None
            assert result.rsi is not None
            assert result.macd is not None
            assert result.bollinger_bands is not None

    @pytest.mark.asyncio
    async def test_fetch_historical_data_error(self, service):
        """Test error handling in data fetching."""
        with patch.object(service, '_fetch_historical_data', side_effect=Exception("API Error")):
            with pytest.raises(ValueError, match="Failed to fetch data"):
                await service.calculate_sma('INVALID')