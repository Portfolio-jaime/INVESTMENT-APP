"""Market Data API client with multiple providers."""

import httpx
from typing import Dict, List, Optional
from datetime import datetime
from app.core.config import settings
from app.schemas.quote import QuoteBase, HistoricalPriceBase, QuoteSearchResponse
from app.services.yahoo_finance import yahoo_finance_client
from app.services.twelve_data import twelve_data_client
from app.services.finnhub import finnhub_client
import structlog

logger = structlog.get_logger()


class AlphaVantageClient:
    """Client for Alpha Vantage API."""

    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ALPHA_VANTAGE_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def get_quote(self, symbol: str) -> Optional[QuoteBase]:
        """Get real-time quote for a symbol."""
        try:
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": self.api_key
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            logger.debug("Alpha Vantage response", symbol=symbol, data=data)

            if "Global Quote" not in data or not data["Global Quote"]:
                logger.warning("No quote data found", symbol=symbol)
                return None

            quote_data = data["Global Quote"]

            return QuoteBase(
                symbol=quote_data.get("01. symbol", symbol),
                exchange="US",  # Alpha Vantage primarily US markets
                price=float(quote_data.get("05. price", 0)),
                open_price=float(quote_data.get("02. open", 0)),
                high=float(quote_data.get("03. high", 0)),
                low=float(quote_data.get("04. low", 0)),
                previous_close=float(quote_data.get("08. previous close", 0)),
                change=float(quote_data.get("09. change", 0)),
                change_percent=float(quote_data.get("10. change percent", "0").rstrip('%')),
                volume=int(quote_data.get("06. volume", 0)),
                timestamp=datetime.now()
            )

        except httpx.HTTPError as e:
            logger.error("HTTP error fetching quote", symbol=symbol, error=str(e))
            return None
        except Exception as e:
            logger.error("Error fetching quote", symbol=symbol, error=str(e))
            return None

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "daily",
        limit: int = 100
    ) -> List[HistoricalPriceBase]:
        """Get historical price data."""
        try:
            function_map = {
                "daily": "TIME_SERIES_DAILY",
                "weekly": "TIME_SERIES_WEEKLY",
                "monthly": "TIME_SERIES_MONTHLY",
            }

            params = {
                "function": function_map.get(timeframe, "TIME_SERIES_DAILY"),
                "symbol": symbol,
                "outputsize": "full",
                "apikey": self.api_key
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            logger.debug("Alpha Vantage historical response", symbol=symbol, timeframe=timeframe, data=data)

            time_series_key = f"Time Series ({timeframe.capitalize()})"
            if time_series_key not in data:
                logger.warning("No historical data found", symbol=symbol)
                return []

            time_series = data[time_series_key]
            historical_data = []

            for date_str, values in time_series.items():
                historical_data.append(HistoricalPriceBase(
                    symbol=symbol,
                    exchange="US",
                    open=float(values["1. open"]),
                    high=float(values["2. high"]),
                    low=float(values["3. low"]),
                    close=float(values["4. close"]),
                    volume=int(values["5. volume"]),
                    timeframe=timeframe[0] + "d" if timeframe == "daily" else timeframe,
                    date=datetime.strptime(date_str, "%Y-%m-%d")
                ))

            return historical_data[:limit]

        except Exception as e:
            logger.error("Error fetching historical data", symbol=symbol, error=str(e))
            return []

    async def search_symbols(self, query: str) -> List[QuoteSearchResponse]:
        """Search for symbols."""
        try:
            params = {
                "function": "SYMBOL_SEARCH",
                "keywords": query,
                "apikey": self.api_key
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if "bestMatches" not in data:
                return []

            results = []
            for match in data["bestMatches"]:
                results.append(QuoteSearchResponse(
                    symbol=match.get("1. symbol", ""),
                    name=match.get("2. name", ""),
                    exchange=match.get("4. region", ""),
                    type=match.get("3. type", ""),
                    currency=match.get("8. currency", "USD"),
                    country=match.get("4. region", "")
                ))

            return results

        except Exception as e:
            logger.error("Error searching symbols", query=query, error=str(e))
            return []


class MarketDataClient:
    """Client for market data with multiple providers and fallback."""

    def __init__(self):
        self.providers = [
            ("Yahoo Finance", yahoo_finance_client),
            ("Twelve Data", twelve_data_client),
            ("Finnhub", finnhub_client),
            ("Alpha Vantage", AlphaVantageClient()),
        ]

    async def get_quote(self, symbol: str) -> Optional[QuoteBase]:
        """Get real-time quote for a symbol with fallback providers."""
        for provider_name, provider in self.providers:
            try:
                logger.info("Trying to get quote from provider", symbol=symbol, provider=provider_name)
                result = await provider.get_quote(symbol)
                if result:
                    logger.info("Successfully got quote from provider", symbol=symbol, provider=provider_name)
                    return result
                else:
                    logger.warning("Provider returned no data", symbol=symbol, provider=provider_name)
            except Exception as e:
                logger.error("Error with provider", symbol=symbol, provider=provider_name, error=str(e))
                continue

        logger.error("All providers failed to get quote", symbol=symbol)
        return None

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "daily",
        limit: int = 100
    ) -> List[HistoricalPriceBase]:
        """Get historical price data with fallback providers."""
        for provider_name, provider in self.providers:
            try:
                logger.info("Trying to get historical data from provider", symbol=symbol, provider=provider_name, timeframe=timeframe, limit=limit)
                result = await provider.get_historical_data(symbol, timeframe, limit)
                if result:
                    logger.info("Successfully got historical data from provider", symbol=symbol, provider=provider_name, records=len(result))
                    return result
                else:
                    logger.warning("Provider returned no historical data", symbol=symbol, provider=provider_name)
            except Exception as e:
                logger.error("Error with provider", symbol=symbol, provider=provider_name, error=str(e))
                continue

        logger.error("All providers failed to get historical data", symbol=symbol)
        return []
