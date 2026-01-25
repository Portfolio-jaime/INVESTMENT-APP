"""Twelve Data API client."""

import httpx
from typing import Optional, List
from datetime import datetime, timedelta
import structlog

from app.schemas.quote import QuoteBase, HistoricalPriceBase
from app.core.config import settings

logger = structlog.get_logger()


class TwelveDataClient:
    """Client for Twelve Data API."""

    BASE_URL = "https://api.twelvedata.com"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TWELVE_DATA_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def get_quote(self, symbol: str) -> Optional[QuoteBase]:
        """Get real-time quote for a symbol."""
        try:
            if not self.api_key:
                logger.warning("Twelve Data API key not configured")
                return None

            params = {
                "symbol": symbol,
                "apikey": self.api_key
            }

            response = await self.client.get(f"{self.BASE_URL}/quote", params=params)
            response.raise_for_status()
            data = response.json()

            if not data or 'close' not in data:
                logger.warning("No quote data found in Twelve Data", symbol=symbol)
                return None

            # Twelve Data may not have change data in basic response
            current_price = float(data.get('close', 0))
            previous_close = float(data.get('previous_close', current_price))

            change = current_price - previous_close
            change_percent = (change / previous_close) * 100 if previous_close > 0 else 0

            return QuoteBase(
                symbol=symbol.upper(),
                exchange=data.get('exchange', 'US'),
                price=current_price,
                open_price=float(data.get('open', 0)) if data.get('open') else None,
                high=float(data.get('high', 0)) if data.get('high') else None,
                low=float(data.get('low', 0)) if data.get('low') else None,
                previous_close=previous_close,
                change=change,
                change_percent=change_percent,
                volume=int(data.get('volume', 0)) if data.get('volume') else None,
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error("Error fetching quote from Twelve Data", symbol=symbol, error=str(e))
            return None

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "daily",
        limit: int = 100
    ) -> List[HistoricalPriceBase]:
        """Get historical price data."""
        try:
            if not self.api_key:
                logger.warning("Twelve Data API key not configured")
                return []

            # Map timeframe
            interval_map = {
                "daily": "1day",
                "weekly": "1week",
                "monthly": "1month"
            }

            params = {
                "symbol": symbol,
                "interval": interval_map.get(timeframe, "1day"),
                "outputsize": min(limit, 5000),  # Twelve Data limit
                "apikey": self.api_key
            }

            response = await self.client.get(f"{self.BASE_URL}/time_series", params=params)
            response.raise_for_status()
            data = response.json()

            if not data or 'values' not in data:
                logger.warning("No historical data found in Twelve Data", symbol=symbol)
                return []

            historical_data = []
            for item in data['values'][:limit]:
                historical_data.append(HistoricalPriceBase(
                    symbol=symbol.upper(),
                    exchange="US",
                    open=float(item['open']),
                    high=float(item['high']),
                    low=float(item['low']),
                    close=float(item['close']),
                    volume=int(item['volume']),
                    adjusted_close=float(item.get('close', item['close'])),  # May not have adjusted
                    timeframe=timeframe[0] + "d" if timeframe == "daily" else timeframe,
                    date=datetime.strptime(item['datetime'], "%Y-%m-%d").date()
                ))

            logger.info(
                "Fetched historical data from Twelve Data",
                symbol=symbol,
                records=len(historical_data)
            )

            return historical_data

        except Exception as e:
            logger.error("Error fetching historical data from Twelve Data", symbol=symbol, error=str(e))
            return []


twelve_data_client = TwelveDataClient()