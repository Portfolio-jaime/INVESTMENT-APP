"""API endpoints for sentiment analysis."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import structlog

from app.schemas.indicators import SentimentResponse
from app.services.sentiment_analysis import sentiment_service

logger = structlog.get_logger()

router = APIRouter()


@router.get("/{symbol}", response_model=SentimentResponse)
async def get_sentiment_analysis(
    symbol: str,
    days: Optional[int] = Query(7, description="Number of days to analyze", ge=1, le=30)
):
    """
    Get sentiment analysis for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        days: Number of days of news to analyze (default: 7, max: 30)

    Returns:
        SentimentResponse with sentiment analysis
    """
    try:
        logger.info("Getting sentiment analysis", symbol=symbol, days=days)
        result = await sentiment_service.analyze_sentiment(symbol.upper())
        return result
    except ValueError as e:
        logger.error("Error getting sentiment analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting sentiment analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")