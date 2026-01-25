"""LLM integration service for market insights."""

import openai
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog
import json

from app.core.config import settings
from app.schemas.indicators import (
    LLMInsight,
    LLMInsightsResponse
)

logger = structlog.get_logger()


class LLMIntegrationService:
    """Service for LLM-powered market analysis and insights."""

    def __init__(self):
        """Initialize the service."""
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.LLM_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS

        if self.api_key:
            openai.api_key = self.api_key
        else:
            logger.warning("OpenAI API key not configured")

    async def generate_market_insights(
        self,
        symbol: str,
        technical_data: Optional[Dict[str, Any]] = None,
        fundamental_data: Optional[Dict[str, Any]] = None,
        sentiment_data: Optional[Dict[str, Any]] = None,
        colombian_market_data: Optional[Dict[str, Any]] = None
    ) -> LLMInsightsResponse:
        """
        Generate comprehensive market insights using LLM.

        Args:
            symbol: Stock symbol
            technical_data: Technical analysis data
            fundamental_data: Fundamental analysis data
            sentiment_data: Sentiment analysis data
            colombian_market_data: Colombian market specific data

        Returns:
            LLMInsightsResponse with generated insights
        """
        try:
            logger.info("Generating LLM market insights", symbol=symbol)

            # Prepare context for LLM
            context = self._prepare_analysis_context(
                symbol, technical_data, fundamental_data, sentiment_data, colombian_market_data
            )

            # Generate different types of insights
            insights = []

            # Technical analysis insight
            if technical_data:
                tech_insight = await self._generate_technical_insight(symbol, context)
                if tech_insight:
                    insights.append(tech_insight)

            # Fundamental analysis insight
            if fundamental_data:
                fund_insight = await self._generate_fundamental_insight(symbol, context)
                if fund_insight:
                    insights.append(fund_insight)

            # Sentiment analysis insight
            if sentiment_data:
                sent_insight = await self._generate_sentiment_insight(symbol, context)
                if sent_insight:
                    insights.append(sent_insight)

            # Combined analysis insight
            combined_insight = await self._generate_combined_insight(symbol, context)
            if combined_insight:
                insights.append(combined_insight)

            return LLMInsightsResponse(
                symbol=symbol.upper(),
                insights=insights,
                model_used=self.model
            )

        except Exception as e:
            logger.error("Error generating LLM insights", symbol=symbol, error=str(e))
            raise ValueError(f"Failed to generate LLM insights for {symbol}: {str(e)}")

    def _prepare_analysis_context(
        self,
        symbol: str,
        technical_data: Optional[Dict[str, Any]],
        fundamental_data: Optional[Dict[str, Any]],
        sentiment_data: Optional[Dict[str, Any]],
        colombian_market_data: Optional[Dict[str, Any]]
    ) -> str:
        """Prepare context string for LLM analysis."""
        context_parts = [f"Stock Symbol: {symbol}"]

        if technical_data:
            context_parts.append(f"Technical Indicators: {json.dumps(technical_data, indent=2)}")

        if fundamental_data:
            context_parts.append(f"Fundamental Data: {json.dumps(fundamental_data, indent=2)}")

        if sentiment_data:
            context_parts.append(f"Sentiment Analysis: {json.dumps(sentiment_data, indent=2)}")

        if colombian_market_data:
            context_parts.append(f"Colombian Market Context: {json.dumps(colombian_market_data, indent=2)}")

        return "\n\n".join(context_parts)

    async def _generate_technical_insight(self, symbol: str, context: str) -> Optional[LLMInsight]:
        """Generate technical analysis insight."""
        try:
            prompt = f"""
            Based on the following technical analysis data for {symbol}, provide a concise technical analysis insight:

            {context}

            Focus on:
            - Current trend direction
            - Key support/resistance levels
            - Momentum indicators
            - Potential entry/exit signals

            Keep the analysis under 200 words and be specific to the data provided.
            """

            response = await self._call_openai(prompt)

            if response:
                return LLMInsight(
                    symbol=symbol,
                    insight_type="technical",
                    title="Technical Analysis Insight",
                    summary=response[:200],
                    detailed_analysis=response,
                    confidence_level="medium",
                    key_factors=["trend_analysis", "momentum", "support_resistance"],
                    recommendation=self._extract_recommendation(response)
                )

        except Exception as e:
            logger.error("Error generating technical insight", symbol=symbol, error=str(e))

        return None

    async def _generate_fundamental_insight(self, symbol: str, context: str) -> Optional[LLMInsight]:
        """Generate fundamental analysis insight."""
        try:
            prompt = f"""
            Based on the following fundamental analysis data for {symbol}, provide a concise fundamental analysis insight:

            {context}

            Focus on:
            - Financial health assessment
            - Valuation metrics
            - Growth prospects
            - Risk factors

            Keep the analysis under 200 words and be specific to the financial data provided.
            """

            response = await self._call_openai(prompt)

            if response:
                return LLMInsight(
                    symbol=symbol,
                    insight_type="fundamental",
                    title="Fundamental Analysis Insight",
                    summary=response[:200],
                    detailed_analysis=response,
                    confidence_level="high",
                    key_factors=["valuation", "financial_health", "growth_prospects"],
                    recommendation=self._extract_recommendation(response)
                )

        except Exception as e:
            logger.error("Error generating fundamental insight", symbol=symbol, error=str(e))

        return None

    async def _generate_sentiment_insight(self, symbol: str, context: str) -> Optional[LLMInsight]:
        """Generate sentiment analysis insight."""
        try:
            prompt = f"""
            Based on the following sentiment analysis data for {symbol}, provide a concise sentiment analysis insight:

            {context}

            Focus on:
            - Overall market sentiment
            - News impact assessment
            - Social media sentiment trends
            - Potential sentiment-driven price movements

            Keep the analysis under 200 words and be specific to the sentiment data provided.
            """

            response = await self._call_openai(prompt)

            if response:
                return LLMInsight(
                    symbol=symbol,
                    insight_type="sentiment",
                    title="Sentiment Analysis Insight",
                    summary=response[:200],
                    detailed_analysis=response,
                    confidence_level="medium",
                    key_factors=["news_sentiment", "market_mood", "social_signals"],
                    recommendation=self._extract_recommendation(response)
                )

        except Exception as e:
            logger.error("Error generating sentiment insight", symbol=symbol, error=str(e))

        return None

    async def _generate_combined_insight(self, symbol: str, context: str) -> Optional[LLMInsight]:
        """Generate combined analysis insight."""
        try:
            prompt = f"""
            Based on all available data for {symbol}, provide a comprehensive investment insight that combines technical, fundamental, and sentiment analysis:

            {context}

            Provide:
            - Overall investment thesis
            - Key risks and opportunities
            - Time horizon considerations
            - Final recommendation with confidence level

            Structure your response clearly and keep it under 300 words.
            """

            response = await self._call_openai(prompt)

            if response:
                return LLMInsight(
                    symbol=symbol,
                    insight_type="combined",
                    title="Comprehensive Investment Analysis",
                    summary=response[:300],
                    detailed_analysis=response,
                    confidence_level="high",
                    key_factors=["technical_fundamental_sentiment", "risk_assessment", "investment_thesis"],
                    recommendation=self._extract_recommendation(response)
                )

        except Exception as e:
            logger.error("Error generating combined insight", symbol=symbol, error=str(e))

        return None

    async def _call_openai(self, prompt: str) -> Optional[str]:
        """Call OpenAI API with the given prompt."""
        if not self.api_key:
            logger.warning("OpenAI API key not configured, skipping LLM call")
            return None

        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst providing market insights. Be objective, data-driven, and concise."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=30
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error("Error calling OpenAI API", error=str(e))
            return None

    def _extract_recommendation(self, analysis_text: str) -> Optional[str]:
        """Extract recommendation from analysis text."""
        text_lower = analysis_text.lower()

        if any(word in text_lower for word in ['buy', 'long', 'bullish', 'positive']):
            return "BUY"
        elif any(word in text_lower for word in ['sell', 'short', 'bearish', 'negative']):
            return "SELL"
        elif any(word in text_lower for word in ['hold', 'neutral', 'sideways']):
            return "HOLD"
        else:
            return None

    async def generate_custom_insight(self, symbol: str, question: str) -> Optional[LLMInsight]:
        """
        Generate a custom insight based on a specific question.

        Args:
            symbol: Stock symbol
            question: Specific question to answer

        Returns:
            LLMInsight with custom analysis
        """
        try:
            prompt = f"""
            Answer the following question about {symbol} based on available market data and analysis:

            Question: {question}

            Provide a clear, concise answer with supporting reasoning.
            """

            response = await self._call_openai(prompt)

            if response:
                return LLMInsight(
                    symbol=symbol,
                    insight_type="custom",
                    title=f"Analysis: {question[:50]}...",
                    summary=response[:200],
                    detailed_analysis=response,
                    confidence_level="medium",
                    key_factors=["custom_analysis"],
                    recommendation=None
                )

        except Exception as e:
            logger.error("Error generating custom insight", symbol=symbol, question=question, error=str(e))

        return None


# Singleton instance
llm_service = LLMIntegrationService()