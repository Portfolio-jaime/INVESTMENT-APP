"""TRM (Tasa Representativa del Mercado) client for Colombian currency rates."""

import httpx
from typing import Optional, Dict
from datetime import datetime, date
from app.core.config import settings
from app.schemas.quote import CurrencyRate
import structlog

logger = structlog.get_logger()


class TRMClient:
    """Client for Banco de la República TRM API."""

    BASE_URL = "https://www.datos.gov.co/resource/32sa-8pi3.json"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()

    async def get_trm_rate(self, target_date: Optional[date] = None) -> Optional[CurrencyRate]:
        """Get TRM rate for USD to COP.

        Args:
            target_date: Date to get rate for. If None, gets latest available.

        Returns:
            CurrencyRate object with USD/COP rate
        """
        try:
            params = {}
            if target_date:
                # Format: YYYY-MM-DD
                params["vigenciadesde"] = target_date.strftime("%Y-%m-%d")
                params["vigenciahasta"] = target_date.strftime("%Y-%m-%d")

            # Limit to 1 result, ordered by date descending
            params["$limit"] = 1
            params["$order"] = "vigenciadesde DESC"

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if not data:
                logger.warning("No TRM data found", date=target_date)
                return None

            rate_data = data[0]
            trm_value = float(rate_data.get("valor", 0))
            rate_date = datetime.strptime(rate_data.get("vigenciadesde", ""), "%Y-%m-%dT%H:%M:%S.%f").date()

            return CurrencyRate(
                from_currency="USD",
                to_currency="COP",
                rate=trm_value,
                date=rate_date,
                source="TRM"
            )

        except httpx.HTTPError as e:
            logger.error("HTTP error fetching TRM rate", error=str(e))
            return None
        except Exception as e:
            logger.error("Error fetching TRM rate", error=str(e))
            return None

    async def get_historical_rates(self, start_date: date, end_date: date) -> list[CurrencyRate]:
        """Get historical TRM rates between dates."""
        try:
            params = {
                "vigenciadesde": f"{start_date.strftime('%Y-%m-%d')}T00:00:00.000",
                "vigenciahasta": f"{end_date.strftime('%Y-%m-%d')}T23:59:59.999",
                "$order": "vigenciadesde ASC"
            }

            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            rates = []
            for rate_data in data:
                trm_value = float(rate_data.get("valor", 0))
                rate_date = datetime.strptime(rate_data.get("vigenciadesde", ""), "%Y-%m-%dT%H:%M:%S.%f").date()

                rates.append(CurrencyRate(
                    from_currency="USD",
                    to_currency="COP",
                    rate=trm_value,
                    date=rate_date,
                    source="TRM"
                ))

            return rates

        except Exception as e:
            logger.error("Error fetching historical TRM rates", error=str(e))
            return []


# Global client instance
trm_client = TRMClient()