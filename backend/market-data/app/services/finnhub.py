"""Finnhub API client."""

import httpx
from typing import Optional, List
from datetime import datetime, timedelta
import structlog

from app.schemas.quote import QuoteBase, HistoricalPriceBase
from app.core.config import settings

logger = structlog.get_logger()


class FinnhubClient:
    """Client for Finnhub API."""

    BASE_URL = "https://finnhub.io/api/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.FINNHUB_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def get_quote(self, symbol: str) -> Optional[QuoteBase]:
        """Get real-time quote for a symbol."""
        try:
            if not self.api_key:
                logger.warning("Finnhub API key not configured")
                return None

            params = {
                "symbol": symbol,
                "token": self.api_key
            }

            response = await self.client.get(f"{self.BASE_URL}/quote", params=params)
            response.raise_for_status()
            data = response.json()

            if not data or data.get('c', 0) == 0:  # 'c' is current price
                logger.warning("No quote data found in Finnhub", symbol=symbol)
                return None

            current_price = float(data.get('c', 0))
            previous_close = float(data.get('pc', current_price))  # 'pc' is previous close

            change = current_price - previous_close
            change_percent = (change / previous_close) * 100 if previous_close > 0 else 0

            return QuoteBase(
                symbol=symbol.upper(),
                exchange="US",  # Finnhub primarily US markets
                price=current_price,
                open_price=float(data.get('o', 0)) if data.get('o') else None,
                high=float(data.get('h', 0)) if data.get('h') else None,
                low=float(data.get('l', 0)) if data.get('l') else None,
                previous_close=previous_close,
                change=change,
                change_percent=change_percent,
                volume=None,  # Finnhub quote doesn't include volume
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error("Error fetching quote from Finnhub", symbol=symbol, error=str(e))
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
                logger.warning("Finnhub API key not configured")
                return []

            # Finnhub uses resolution: 1, 5, 15, 30, 60, D, W, M
            resolution_map = {
                "daily": "D",
                "weekly": "W",
                "monthly": "M"
            }

            # Calculate date range
            end_date = datetime.now()
            if timeframe == "daily":
                start_date = end_date - timedelta(days=limit)
            elif timeframe == "weekly":
                start_date = end_date - timedelta(weeks=limit)
            else:  # monthly
                start_date = end_date - timedelta(days=limit * 30)

            params = {
                "symbol": symbol,
                "resolution": resolution_map.get(timeframe, "D"),
                "from": int(start_date.timestamp()),
                "to": int(end_date.timestamp()),
                "token": self.api_key
            }

            response = await self.client.get(f"{self.BASE_URL}/stock/candle", params=params)
            response.raise_for_status()
            data = response.json()

            if not data or 'c' not in data or not data['c']:  # 'c' is close prices array
                logger.warning("No historical data found in Finnhub", symbol=symbol)
                return []

            # Finnhub returns arrays: c (close), h (high), l (low), o (open), t (timestamp), v (volume)
            closes = data['c']
            highs = data.get('h', [])
            lows = data.get('l', [])
            opens = data.get('o', [])
            timestamps = data.get('t', [])
            volumes = data.get('v', [])

            historical_data = []
            for i in range(min(len(closes), limit)):
                timestamp = datetime.fromtimestamp(timestamps[i]) if i < len(timestamps) else datetime.now()

                historical_data.append(HistoricalPriceBase(
                    symbol=symbol.upper(),
                    exchange="US",
                    open=float(opens[i]) if i < len(opens) and opens[i] else closes[i],
                    high=float(highs[i]) if i < len(highs) and highs[i] else closes[i],
                    low=float(lows[i]) if i < len(lows) and lows[i] else closes[i],
                    close=float(closes[i]),
                    volume=int(volumes[i]) if i < len(volumes) and volumes[i] else 0,
                    adjusted_close=float(closes[i]),  # Finnhub doesn't provide adjusted prices
                    timeframe=timeframe[0] + "d" if timeframe == "daily" else timeframe,
                    date=timestamp.date()
                ))

            logger.info(
                "Fetched historical data from Finnhub",
                symbol=symbol,
                records=len(historical_data)
            )

            return historical_data

        except Exception as e:
            logger.error("Error fetching historical data from Finnhub", symbol=symbol, error=str(e))
            return []


finnhub_client = FinnhubClient()