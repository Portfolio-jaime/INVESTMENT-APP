"""Technical indicators calculation service using ta library."""

import pandas as pd
import ta
import httpx
from typing import List, Dict, Any
from datetime import datetime
import structlog

from app.core.config import settings
from app.schemas.indicators import (
    IndicatorDataPoint,
    MACDDataPoint,
    BollingerBandsDataPoint,
    SMAResponse,
    EMAResponse,
    RSIResponse,
    MACDResponse,
    BollingerBandsResponse,
    AllIndicatorsResponse
)

logger = structlog.get_logger()


class TechnicalIndicatorService:
    """Service for calculating technical indicators."""

    def __init__(self):
        """Initialize the service."""
        self.market_data_url = settings.MARKET_DATA_SERVICE_URL

    async def _fetch_historical_data(self, symbol: str, days: int = 100) -> pd.DataFrame:
        """
        Fetch historical price data from Market Data Service.

        Args:
            symbol: Stock symbol
            days: Number of days of historical data

        Returns:
            DataFrame with historical price data
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.market_data_url}/api/v1/market-data/quotes/{symbol}/historical",
                    params={"timeframe": "daily", "limit": days}
                )
                response.raise_for_status()
                data = response.json()

            if not data:
                raise ValueError(f"No historical data available for {symbol}")

            # Convert to DataFrame
            df = pd.DataFrame(data)
            df['timestamp'] = pd.to_datetime(df['date'])
            df = df.sort_values('timestamp')
            df = df.set_index('timestamp')

            logger.info(
                "Fetched historical data",
                symbol=symbol,
                records=len(df),
                columns=list(df.columns)
            )

            return df

        except httpx.HTTPError as e:
            logger.error("Failed to fetch historical data", symbol=symbol, error=str(e))
            raise ValueError(f"Failed to fetch data for {symbol}: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error fetching data", symbol=symbol, error=str(e))
            raise

    async def calculate_sma(self, symbol: str, period: int = None) -> SMAResponse:
        """
        Calculate Simple Moving Average.

        Args:
            symbol: Stock symbol
            period: SMA period (default from settings)

        Returns:
            SMAResponse with calculated values
        """
        if period is None:
            period = settings.DEFAULT_SMA_PERIOD

        df = await self._fetch_historical_data(symbol, days=period * 3)

        # Calculate SMA using ta library
        df['sma'] = ta.trend.sma_indicator(df['close'], window=period)

        # Remove NaN values
        df = df.dropna(subset=['sma'])

        # Convert to response format
        data = [
            IndicatorDataPoint(timestamp=idx, value=float(row['sma']))
            for idx, row in df.iterrows()
        ]

        return SMAResponse(symbol=symbol, period=period, data=data)

    async def calculate_ema(self, symbol: str, period: int = None) -> EMAResponse:
        """
        Calculate Exponential Moving Average.

        Args:
            symbol: Stock symbol
            period: EMA period (default from settings)

        Returns:
            EMAResponse with calculated values
        """
        if period is None:
            period = settings.DEFAULT_EMA_PERIOD

        df = await self._fetch_historical_data(symbol, days=period * 3)

        # Calculate EMA using ta library
        df['ema'] = ta.trend.ema_indicator(df['close'], window=period)

        # Remove NaN values
        df = df.dropna(subset=['ema'])

        # Convert to response format
        data = [
            IndicatorDataPoint(timestamp=idx, value=float(row['ema']))
            for idx, row in df.iterrows()
        ]

        return EMAResponse(symbol=symbol, period=period, data=data)

    async def calculate_rsi(self, symbol: str, period: int = None) -> RSIResponse:
        """
        Calculate Relative Strength Index.

        Args:
            symbol: Stock symbol
            period: RSI period (default from settings)

        Returns:
            RSIResponse with calculated values
        """
        if period is None:
            period = settings.DEFAULT_RSI_PERIOD

        df = await self._fetch_historical_data(symbol, days=period * 3)

        # Calculate RSI using ta library
        df['rsi'] = ta.momentum.rsi(df['close'], window=period)

        # Remove NaN values
        df = df.dropna(subset=['rsi'])

        # Convert to response format
        data = [
            IndicatorDataPoint(timestamp=idx, value=float(row['rsi']))
            for idx, row in df.iterrows()
        ]

        return RSIResponse(symbol=symbol, period=period, data=data)

    async def calculate_macd(
        self,
        symbol: str,
        fast: int = None,
        slow: int = None,
        signal: int = None
    ) -> MACDResponse:
        """
        Calculate MACD (Moving Average Convergence Divergence).

        Args:
            symbol: Stock symbol
            fast: Fast period (default from settings)
            slow: Slow period (default from settings)
            signal: Signal period (default from settings)

        Returns:
            MACDResponse with calculated values
        """
        if fast is None:
            fast = settings.MACD_FAST_PERIOD
        if slow is None:
            slow = settings.MACD_SLOW_PERIOD
        if signal is None:
            signal = settings.MACD_SIGNAL_PERIOD

        df = await self._fetch_historical_data(symbol, days=slow * 3)

        # Calculate MACD using ta library
        df['macd'] = ta.trend.macd(df['close'], window_fast=fast, window_slow=slow)
        df['signal'] = ta.trend.macd_signal(df['close'], window_fast=fast, window_slow=slow, window_sign=signal)
        df['histogram'] = ta.trend.macd_diff(df['close'], window_fast=fast, window_slow=slow, window_sign=signal)

        # Remove NaN values
        df = df.dropna(subset=['macd', 'signal', 'histogram'])

        # Convert to response format
        data = [
            MACDDataPoint(
                timestamp=idx,
                macd=float(row['macd']),
                signal=float(row['signal']),
                histogram=float(row['histogram'])
            )
            for idx, row in df.iterrows()
        ]

        return MACDResponse(
            symbol=symbol,
            fast_period=fast,
            slow_period=slow,
            signal_period=signal,
            data=data
        )

    async def calculate_bollinger_bands(
        self,
        symbol: str,
        period: int = None,
        std_dev: float = None
    ) -> BollingerBandsResponse:
        """
        Calculate Bollinger Bands.

        Args:
            symbol: Stock symbol
            period: Period for moving average (default from settings)
            std_dev: Standard deviation multiplier (default from settings)

        Returns:
            BollingerBandsResponse with calculated values
        """
        if period is None:
            period = settings.DEFAULT_BOLLINGER_PERIOD
        if std_dev is None:
            std_dev = settings.DEFAULT_BOLLINGER_STD

        df = await self._fetch_historical_data(symbol, days=period * 3)

        # Calculate Bollinger Bands using ta library
        df['bb_upper'] = ta.volatility.bollinger_hband(df['close'], window=period, window_dev=std_dev)
        df['bb_middle'] = ta.volatility.bollinger_mavg(df['close'], window=period)
        df['bb_lower'] = ta.volatility.bollinger_lband(df['close'], window=period, window_dev=std_dev)
        df['bb_bandwidth'] = df['bb_upper'] - df['bb_lower']

        # Remove NaN values
        df = df.dropna(subset=['bb_upper', 'bb_middle', 'bb_lower'])

        # Convert to response format
        data = [
            BollingerBandsDataPoint(
                timestamp=idx,
                upper=float(row['bb_upper']),
                middle=float(row['bb_middle']),
                lower=float(row['bb_lower']),
                bandwidth=float(row['bb_bandwidth']) if pd.notna(row['bb_bandwidth']) else None
            )
            for idx, row in df.iterrows()
        ]

        return BollingerBandsResponse(
            symbol=symbol,
            period=period,
            std_dev=std_dev,
            data=data
        )

    async def calculate_all_indicators(self, symbol: str) -> AllIndicatorsResponse:
        """
        Calculate all technical indicators for a symbol.

        Args:
            symbol: Stock symbol

        Returns:
            AllIndicatorsResponse with all indicators
        """
        # Calculate all indicators concurrently would be ideal, but for simplicity we'll do sequential
        sma = await self.calculate_sma(symbol)
        ema = await self.calculate_ema(symbol)
        rsi = await self.calculate_rsi(symbol)
        macd = await self.calculate_macd(symbol)
        bollinger = await self.calculate_bollinger_bands(symbol)

        return AllIndicatorsResponse(
            symbol=symbol,
            sma=sma,
            ema=ema,
            rsi=rsi,
            macd=macd,
            bollinger_bands=bollinger
        )


# Singleton instance
indicator_service = TechnicalIndicatorService()
