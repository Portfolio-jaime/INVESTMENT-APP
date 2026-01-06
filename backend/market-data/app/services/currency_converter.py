"""Currency conversion service for COP and other currencies."""

from typing import Optional
from datetime import date
from forex_python.converter import CurrencyRates
from app.services.trm import trm_client
from app.services.cache_service import cache_service
from app.schemas.quote import CurrencyRate
import structlog

logger = structlog.get_logger()


class CurrencyConverter:
    """Service for converting between currencies with Colombian market support."""

    def __init__(self):
        self.forex_rates = CurrencyRates()
        self.trm_client = trm_client

    async def get_exchange_rate(
        self,
        from_currency: str,
        to_currency: str,
        target_date: Optional[date] = None
    ) -> Optional[float]:
        """Get exchange rate between two currencies.

        For COP conversions, uses TRM when possible.
        Falls back to forex-python for other currencies.
        """
        try:
            date_key = target_date.isoformat() if target_date else None

            # Check cache first
            cached_rate = await cache_service.get_currency_rate(from_currency, to_currency, date_key)
            if cached_rate is not None:
                return cached_rate

            rate = None

            # Special handling for COP (Colombian Peso)
            if from_currency == "USD" and to_currency == "COP":
                trm_rate = await self.trm_client.get_trm_rate(target_date)
                if trm_rate:
                    rate = trm_rate.rate
                else:
                    logger.warning("TRM rate not available, falling back to forex")

            elif from_currency == "COP" and to_currency == "USD":
                trm_rate = await self.trm_client.get_trm_rate(target_date)
                if trm_rate:
                    rate = 1 / trm_rate.rate
                else:
                    logger.warning("TRM rate not available, falling back to forex")

            # For other currency pairs or fallback, use forex-python
            if rate is None:
                if target_date:
                    # Get historical rate
                    rate = self.forex_rates.get_rate(from_currency, to_currency, target_date)
                else:
                    # Get latest rate
                    rate = self.forex_rates.get_rate(from_currency, to_currency)

            # Cache the result
            if rate is not None:
                await cache_service.set_currency_rate(from_currency, to_currency, rate, date_key)

            return rate

        except Exception as e:
            logger.error(
                "Error getting exchange rate",
                from_currency=from_currency,
                to_currency=to_currency,
                date=target_date,
                error=str(e)
            )
            return None

    async def convert_amount(
        self,
        amount: float,
        from_currency: str,
        to_currency: str,
        target_date: Optional[date] = None
    ) -> Optional[float]:
        """Convert an amount from one currency to another."""
        try:
            rate = await self.get_exchange_rate(from_currency, to_currency, target_date)
            if rate:
                return amount * rate
            return None

        except Exception as e:
            logger.error(
                "Error converting amount",
                amount=amount,
                from_currency=from_currency,
                to_currency=to_currency,
                error=str(e)
            )
            return None

    async def convert_quote_to_cop(self, quote_price: float, quote_currency: str) -> Optional[float]:
        """Convert a quote price to COP."""
        if quote_currency == "COP":
            return quote_price

        return await self.convert_amount(quote_price, quote_currency, "COP")


# Global converter instance
currency_converter = CurrencyConverter()