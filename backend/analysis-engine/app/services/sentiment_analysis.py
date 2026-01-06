"""Sentiment analysis service."""

import httpx
import pandas as pd
from transformers import pipeline
from textblob import TextBlob
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import structlog
import asyncio

from app.core.config import settings
from app.schemas.indicators import (
    SentimentData,
    SentimentSummary,
    SentimentResponse
)

logger = structlog.get_logger()


class SentimentAnalysisService:
    """Service for sentiment analysis of market news and social media."""

    def __init__(self):
        """Initialize the service."""
        self.news_api_key = settings.NEWS_API_KEY
        self.sentiment_model = None
        self._load_sentiment_model()

    def _load_sentiment_model(self):
        """Load the sentiment analysis model."""
        try:
            self.sentiment_model = pipeline(
                "sentiment-analysis",
                model=settings.SENTIMENT_MODEL,
                return_all_scores=True
            )
            logger.info("Sentiment analysis model loaded", model=settings.SENTIMENT_MODEL)
        except Exception as e:
            logger.warning("Failed to load sentiment model, using TextBlob fallback", error=str(e))
            self.sentiment_model = None

    async def analyze_sentiment(self, symbol: str) -> SentimentResponse:
        """
        Analyze sentiment for a symbol from various sources.

        Args:
            symbol: Stock symbol

        Returns:
            SentimentResponse with analysis results
        """
        try:
            logger.info("Analyzing sentiment", symbol=symbol)

            # Fetch news articles
            articles = await self._fetch_news_articles(symbol)

            # Analyze sentiment for each article
            sentiment_data = []
            for article in articles:
                sentiment = await self._analyze_article_sentiment(article)
                if sentiment:
                    sentiment_data.append(sentiment)

            # Calculate summary
            summary = self._calculate_sentiment_summary(symbol, sentiment_data)

            return SentimentResponse(
                symbol=symbol.upper(),
                summary=summary,
                recent_sentiments=sentiment_data[-10:]  # Last 10 articles
            )

        except Exception as e:
            logger.error("Error analyzing sentiment", symbol=symbol, error=str(e))
            raise ValueError(f"Failed to analyze sentiment for {symbol}: {str(e)}")

    async def _fetch_news_articles(self, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Fetch news articles for a symbol.

        Args:
            symbol: Stock symbol
            days: Number of days to look back

        Returns:
            List of article dictionaries
        """
        articles = []

        try:
            # Try NewsAPI if key is available
            if self.news_api_key:
                articles.extend(await self._fetch_from_newsapi(symbol, days))

            # Try Yahoo Finance news
            articles.extend(await self._fetch_from_yahoo(symbol, days))

            # Try other sources if needed
            if len(articles) < 5:
                articles.extend(await self._fetch_from_additional_sources(symbol, days))

        except Exception as e:
            logger.warning("Error fetching news articles", symbol=symbol, error=str(e))

        return articles[:20]  # Limit to 20 articles

    async def _fetch_from_newsapi(self, symbol: str, days: int) -> List[Dict[str, Any]]:
        """Fetch articles from NewsAPI."""
        try:
            from_date = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": f'"{symbol}" stock OR "{symbol}" market',
                        "from": from_date,
                        "sortBy": "relevancy",
                        "apiKey": self.news_api_key,
                        "language": "en"
                    }
                )
                response.raise_for_status()
                data = response.json()

                articles = []
                for article in data.get('articles', []):
                    articles.append({
                        'title': article.get('title', ''),
                        'description': article.get('description', ''),
                        'content': article.get('content', ''),
                        'publishedAt': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', 'NewsAPI'),
                        'url': article.get('url', '')
                    })

                return articles

        except Exception as e:
            logger.warning("Error fetching from NewsAPI", error=str(e))
            return []

    async def _fetch_from_yahoo(self, symbol: str, days: int) -> List[Dict[str, Any]]:
        """Fetch articles from Yahoo Finance."""
        try:
            import yfinance as yf

            ticker = yf.Ticker(symbol)
            news = ticker.news

            articles = []
            for item in news[:10]:  # Limit to 10
                articles.append({
                    'title': item.get('title', ''),
                    'description': item.get('summary', ''),
                    'content': item.get('summary', ''),
                    'publishedAt': datetime.fromtimestamp(item.get('providerPublishTime', 0)).isoformat(),
                    'source': 'Yahoo Finance',
                    'url': item.get('link', '')
                })

            return articles

        except Exception as e:
            logger.warning("Error fetching from Yahoo Finance", error=str(e))
            return []

    async def _fetch_from_additional_sources(self, symbol: str, days: int) -> List[Dict[str, Any]]:
        """Fetch from additional sources as fallback."""
        # This could be expanded to include more news sources
        return []

    async def _analyze_article_sentiment(self, article: Dict[str, Any]) -> Optional[SentimentData]:
        """
        Analyze sentiment of a single article.

        Args:
            article: Article dictionary

        Returns:
            SentimentData object or None if analysis fails
        """
        try:
            text = f"{article.get('title', '')} {article.get('description', '')}".strip()

            if not text:
                return None

            sentiment_result = await self._classify_sentiment(text)

            if sentiment_result:
                return SentimentData(
                    source=article.get('source', 'Unknown'),
                    title=article.get('title', ''),
                    sentiment=sentiment_result['label'],
                    confidence=sentiment_result['confidence'],
                    published_at=datetime.fromisoformat(article.get('publishedAt', '').replace('Z', '+00:00'))
                    if article.get('publishedAt') else datetime.utcnow()
                )

        except Exception as e:
            logger.warning("Error analyzing article sentiment", error=str(e))

        return None

    async def _classify_sentiment(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Classify sentiment of text using available models.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with label and confidence
        """
        try:
            if self.sentiment_model:
                # Use transformer model
                results = self.sentiment_model(text)
                if results and len(results[0]) > 0:
                    # Get the highest scoring label
                    best_result = max(results[0], key=lambda x: x['score'])
                    return {
                        'label': best_result['label'].lower(),
                        'confidence': best_result['score']
                    }

            # Fallback to TextBlob
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity

            if polarity > 0.1:
                label = 'positive'
            elif polarity < -0.1:
                label = 'negative'
            else:
                label = 'neutral'

            confidence = abs(polarity)

            return {
                'label': label,
                'confidence': confidence
            }

        except Exception as e:
            logger.error("Error classifying sentiment", error=str(e))
            return None

    def _calculate_sentiment_summary(self, symbol: str, sentiment_data: List[SentimentData]) -> SentimentSummary:
        """
        Calculate sentiment summary from individual analyses.

        Args:
            symbol: Stock symbol
            sentiment_data: List of sentiment data points

        Returns:
            SentimentSummary object
        """
        if not sentiment_data:
            return SentimentSummary(
                symbol=symbol,
                overall_sentiment='neutral',
                average_confidence=0.0,
                positive_count=0,
                negative_count=0,
                neutral_count=0,
                sources_analyzed=0
            )

        positive_count = sum(1 for s in sentiment_data if s.sentiment == 'positive' or s.sentiment == 'LABEL_2')
        negative_count = sum(1 for s in sentiment_data if s.sentiment == 'negative' or s.sentiment == 'LABEL_0')
        neutral_count = sum(1 for s in sentiment_data if s.sentiment == 'neutral' or s.sentiment == 'LABEL_1')

        total = len(sentiment_data)
        avg_confidence = sum(s.confidence for s in sentiment_data) / total

        # Determine overall sentiment
        if positive_count > negative_count and positive_count > neutral_count:
            overall = 'positive'
        elif negative_count > positive_count and negative_count > neutral_count:
            overall = 'negative'
        else:
            overall = 'neutral'

        return SentimentSummary(
            symbol=symbol,
            overall_sentiment=overall,
            average_confidence=avg_confidence,
            positive_count=positive_count,
            negative_count=negative_count,
            neutral_count=neutral_count,
            sources_analyzed=total
        )


# Singleton instance
sentiment_service = SentimentAnalysisService()