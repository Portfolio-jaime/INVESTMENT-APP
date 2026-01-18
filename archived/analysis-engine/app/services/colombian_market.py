"""Colombian market analysis service."""

import httpx
import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog

from app.core.config import settings
from app.schemas.indicators import (
    TRMData,
    TRMImpact,
    BVCPattern,
    ColombianMarketResponse
)

logger = structlog.get_logger()


class ColombianMarketService:
    """Service for Colombian market-specific analysis."""

    def __init__(self):
        """Initialize the service."""
        self.trm_api_url = settings.TRM_API_URL
        self.bvc_api_url = settings.BVC_API_URL

    async def analyze_colombian_market(self, symbol: str) -> ColombianMarketResponse:
        """
        Analyze Colombian market factors for a symbol.

        Args:
            symbol: Stock symbol

        Returns:
            ColombianMarketResponse with TRM impact and BVC patterns
        """
        try:
            logger.info("Analyzing Colombian market factors", symbol=symbol)

            # Get TRM impact
            trm_impact = await self._analyze_trm_impact(symbol)

            # Get BVC pattern
            bvc_pattern = await self._analyze_bvc_pattern(symbol)

            # Generate market context
            market_context = await self._generate_market_context(symbol, trm_impact, bvc_pattern)

            return ColombianMarketResponse(
                symbol=symbol.upper(),
                trm_impact=trm_impact,
                bvc_pattern=bvc_pattern,
                market_context=market_context
            )

        except Exception as e:
            logger.error("Error analyzing Colombian market", symbol=symbol, error=str(e))
            raise ValueError(f"Failed to analyze Colombian market for {symbol}: {str(e)}")

    async def _analyze_trm_impact(self, symbol: str) -> TRMImpact:
        """
        Analyze the impact of TRM (Representative Market Rate) on a symbol.

        Args:
            symbol: Stock symbol

        Returns:
            TRMImpact analysis
        """
        try:
            # Fetch recent TRM data
            trm_data = await self._fetch_trm_data(days=30)

            if not trm_data:
                # Return default impact if no TRM data
                return TRMImpact(
                    symbol=symbol,
                    correlation_coefficient=0.0,
                    impact_strength="unknown",
                    recent_trm_changes=[],
                    analysis_period_days=30
                )

            # For Colombian stocks, we need to analyze correlation with TRM
            # This is a simplified analysis - in reality, you'd need historical price data
            # and TRM data to calculate proper correlation

            # Calculate TRM volatility
            rates = [t.rate for t in trm_data]
            if len(rates) > 1:
                trm_volatility = np.std(rates) / np.mean(rates)
            else:
                trm_volatility = 0.0

            # Determine impact strength based on TRM volatility and symbol type
            if symbol.endswith('.CB'):  # Colombian stock
                # Colombian stocks are more sensitive to TRM changes
                if trm_volatility > 0.02:  # 2% volatility
                    impact_strength = "strong"
                    correlation = 0.7
                elif trm_volatility > 0.01:  # 1% volatility
                    impact_strength = "moderate"
                    correlation = 0.4
                else:
                    impact_strength = "weak"
                    correlation = 0.1
            else:
                # International stocks have weaker correlation
                impact_strength = "weak"
                correlation = 0.2

            return TRMImpact(
                symbol=symbol,
                correlation_coefficient=correlation,
                impact_strength=impact_strength,
                recent_trm_changes=trm_data[-7:],  # Last 7 days
                analysis_period_days=30
            )

        except Exception as e:
            logger.error("Error analyzing TRM impact", symbol=symbol, error=str(e))
            return TRMImpact(
                symbol=symbol,
                correlation_coefficient=0.0,
                impact_strength="unknown",
                recent_trm_changes=[],
                analysis_period_days=30
            )

    async def _fetch_trm_data(self, days: int = 30) -> List[TRMData]:
        """
        Fetch TRM data from Colombian government API.

        Args:
            days: Number of days of data to fetch

        Returns:
            List of TRMData objects
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)

            # TRM API query parameters
            params = {
                "$where": f"vigenciadesde >= '{start_date.strftime('%Y-%m-%d')}' AND vigenciadesde <= '{end_date.strftime('%Y-%m-%d')}'",
                "$order": "vigenciadesde DESC",
                "$limit": 1000
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.trm_api_url, params=params)
                response.raise_for_status()
                data = response.json()

            trm_data = []
            for item in data:
                try:
                    # Parse TRM data
                    date_str = item.get('vigenciadesde', '')
                    rate_str = item.get('valor', '')

                    # Convert date and rate
                    date = datetime.fromisoformat(date_str.replace('T', ' ').split('.')[0])
                    rate = float(rate_str.replace(',', '.')) if rate_str else 0.0

                    trm_data.append(TRMData(
                        date=date,
                        rate=rate,
                        source="Banco de la República"
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning("Error parsing TRM data item", error=str(e), item=item)
                    continue

            # Sort by date
            trm_data.sort(key=lambda x: x.date)

            logger.info("Fetched TRM data", records=len(trm_data), days=days)
            return trm_data

        except Exception as e:
            logger.error("Error fetching TRM data", error=str(e))
            return []

    async def _analyze_bvc_pattern(self, symbol: str) -> BVCPattern:
        """
        Analyze BVC (Bogota Stock Exchange) market patterns.

        Args:
            symbol: Stock symbol

        Returns:
            BVCPattern analysis
        """
        try:
            # For Colombian stocks, analyze BVC market patterns
            # This is a simplified analysis - in a real implementation,
            # you'd fetch BVC index data and analyze patterns

            if not symbol.endswith('.CB'):
                # Not a Colombian stock
                return BVCPattern(
                    pattern_type="neutral",
                    confidence=0.5,
                    description="Symbol is not listed on BVC",
                    detected_at=datetime.utcnow(),
                    supporting_indicators=[]
                )

            # Simplified pattern detection based on current market conditions
            # In reality, this would use technical analysis on BVC index

            # Mock pattern detection - replace with actual analysis
            patterns = ["bullish", "bearish", "sideways"]
            pattern_type = np.random.choice(patterns, p=[0.4, 0.3, 0.3])

            confidence = np.random.uniform(0.6, 0.9)

            descriptions = {
                "bullish": "BVC showing upward momentum with increasing volume",
                "bearish": "BVC showing downward pressure with weakening support",
                "sideways": "BVC trading in a consolidation pattern"
            }

            indicators = {
                "bullish": ["RSI > 50", "MACD positive", "Volume increasing"],
                "bearish": ["RSI < 50", "MACD negative", "Volume decreasing"],
                "sideways": ["RSI neutral", "MACD flat", "Low volatility"]
            }

            return BVCPattern(
                pattern_type=pattern_type,
                confidence=confidence,
                description=descriptions[pattern_type],
                detected_at=datetime.utcnow(),
                supporting_indicators=indicators[pattern_type]
            )

        except Exception as e:
            logger.error("Error analyzing BVC pattern", symbol=symbol, error=str(e))
            return BVCPattern(
                pattern_type="unknown",
                confidence=0.0,
                description="Unable to analyze BVC pattern",
                detected_at=datetime.utcnow(),
                supporting_indicators=[]
            )

    async def _generate_market_context(self, symbol: str, trm_impact: TRMImpact, bvc_pattern: BVCPattern) -> str:
        """
        Generate market context description.

        Args:
            symbol: Stock symbol
            trm_impact: TRM impact analysis
            bvc_pattern: BVC pattern analysis

        Returns:
            Market context description
        """
        try:
            context_parts = []

            # TRM context
            if trm_impact.impact_strength == "strong":
                context_parts.append(f"Strong TRM sensitivity (correlation: {trm_impact.correlation_coefficient:.2f})")
            elif trm_impact.impact_strength == "moderate":
                context_parts.append(f"Moderate TRM sensitivity (correlation: {trm_impact.correlation_coefficient:.2f})")
            else:
                context_parts.append("Limited TRM impact")

            # BVC context
            if symbol.endswith('.CB'):
                context_parts.append(f"BVC market pattern: {bvc_pattern.pattern_type} (confidence: {bvc_pattern.confidence:.1%})")
            else:
                context_parts.append("International stock - BVC patterns not directly applicable")

            # Overall market sentiment
            if bvc_pattern.pattern_type == "bullish" and trm_impact.impact_strength != "strong":
                context_parts.append("Favorable market conditions")
            elif bvc_pattern.pattern_type == "bearish" or trm_impact.impact_strength == "strong":
                context_parts.append("Challenging market conditions")
            else:
                context_parts.append("Neutral market conditions")

            return ". ".join(context_parts)

        except Exception as e:
            logger.error("Error generating market context", symbol=symbol, error=str(e))
            return "Market context analysis unavailable"

    async def get_colombian_market_indicators(self) -> Dict[str, Any]:
        """Get current Colombian market indicators."""
        try:
            # Get latest TRM
            trm_data = await self._fetch_trm_data(days=1)
            latest_trm = trm_data[-1] if trm_data else None

            # Get BVC index data (simplified)
            bvc_data = await self._get_bvc_index_data()

            return {
                "trm": {
                    "latest_rate": latest_trm.rate if latest_trm else None,
                    "date": latest_trm.date.isoformat() if latest_trm else None
                },
                "bvc": bvc_data,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error("Error getting Colombian market indicators", error=str(e))
            return {}

    async def _get_bvc_index_data(self) -> Dict[str, Any]:
        """Get BVC index data."""
        # This would fetch actual BVC data from their API
        # For now, return mock data
        return {
            "colcap": 1500.0,  # Mock COLCAP index
            "change_percent": 0.5,
            "volume": 1000000,
            "status": "open"
        }


# Singleton instance
colombian_market_service = ColombianMarketService()