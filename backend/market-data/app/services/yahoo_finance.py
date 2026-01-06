"""Yahoo Finance API client."""

import yfinance as yf
from typing import Optional, List
from datetime import datetime, timedelta
import structlog

from app.schemas.quote import QuoteBase, HistoricalPriceBase
from app.core.config import settings

logger = structlog.get_logger()


class YahooFinanceClient:
    """Client for Yahoo Finance API."""

    def __init__(self):
        """Initialize the client."""
        pass

    async def get_quote(self, symbol: str) -> Optional[QuoteBase]:
        """Get real-time quote for a symbol."""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            if not info or 'regularMarketPrice' not in info:
                logger.warning("No quote data found in Yahoo Finance", symbol=symbol)
                return None

            # Get previous close for change calculation
            hist = ticker.history(period="2d")
            if len(hist) < 2:
                previous_close = info.get('regularMarketPreviousClose', info.get('regularMarketPrice', 0))
            else:
                previous_close = hist.iloc[-2]['Close']

            current_price = info.get('regularMarketPrice', 0)
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100 if previous_close > 0 else 0

            return QuoteBase(
                symbol=symbol.upper(),
                exchange="US",  # Yahoo Finance primarily US markets
                price=current_price,
                open_price=info.get('regularMarketOpen'),
                high=info.get('dayHigh'),
                low=info.get('dayLow'),
                previous_close=previous_close,
                change=change,
                change_percent=change_percent,
                volume=info.get('regularMarketVolume'),
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error("Error fetching quote from Yahoo Finance", symbol=symbol, error=str(e))
            return None

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "daily",
        limit: int = 100
    ) -> List[HistoricalPriceBase]:
        """Get historical price data."""
        try:
            ticker = yf.Ticker(symbol)

            # Calculate start date
            end_date = datetime.now()
            start_date = end_date - timedelta(days=limit)

            # Download historical data
            hist = ticker.history(start=start_date, end=end_date, interval="1d")

            if hist.empty:
                logger.warning("No historical data found in Yahoo Finance", symbol=symbol)
                return []

            historical_data = []
            for idx, row in hist.iterrows():
                historical_data.append(HistoricalPriceBase(
                    symbol=symbol.upper(),
                    exchange="US",
                    open=float(row['Open']),
                    high=float(row['High']),
                    low=float(row['Low']),
                    close=float(row['Close']),
                    volume=int(row['Volume']),
                    adjusted_close=float(row.get('Adj Close', row['Close'])),
                    timeframe="daily",
                    date=idx.date()
                ))

            logger.info(
                "Fetched historical data from Yahoo Finance",
                symbol=symbol,
                records=len(historical_data),
                limit=limit
            )

            return historical_data

        except Exception as e:
            logger.error("Error fetching historical data from Yahoo Finance", symbol=symbol, error=str(e))
            return []


yahoo_finance_client = YahooFinanceClient()