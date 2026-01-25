"""API endpoints for LLM-powered market insights."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import structlog

from app.schemas.indicators import LLMInsightsResponse, LLMInsight
from app.services.llm_integration import llm_service
from app.services.technical_indicators import indicator_service
from app.services.fundamental_analysis import fundamental_service
from app.services.sentiment_analysis import sentiment_service
from app.services.colombian_market import colombian_market_service

logger = structlog.get_logger()

router = APIRouter()


@router.get("/{symbol}", response_model=LLMInsightsResponse)
async def get_llm_insights(
    symbol: str,
    include_technical: bool = Query(True, description="Include technical analysis"),
    include_fundamental: bool = Query(True, description="Include fundamental analysis"),
    include_sentiment: bool = Query(True, description="Include sentiment analysis"),
    include_colombian: bool = Query(True, description="Include Colombian market analysis")
):
    """
    Get comprehensive LLM-powered market insights for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL, ECOPETROL.CB)
        include_technical: Whether to include technical analysis
        include_fundamental: Whether to include fundamental analysis
        include_sentiment: Whether to include sentiment analysis
        include_colombian: Whether to include Colombian market analysis

    Returns:
        LLMInsightsResponse with AI-generated insights
    """
    try:
        logger.info("Getting LLM insights", symbol=symbol)

        # Gather data from different services
        technical_data = None
        fundamental_data = None
        sentiment_data = None
        colombian_data = None

        if include_technical:
            try:
                technical_result = await indicator_service.calculate_all_indicators(symbol.upper())
                technical_data = {
                    "sma": {"period": technical_result.sma.period, "latest_value": technical_result.sma.data[-1].value if technical_result.sma.data else None},
                    "ema": {"period": technical_result.ema.period, "latest_value": technical_result.ema.data[-1].value if technical_result.ema.data else None},
                    "rsi": {"period": technical_result.rsi.period, "latest_value": technical_result.rsi.data[-1].value if technical_result.rsi.data else None},
                    "macd": {"fast": technical_result.macd.fast_period, "slow": technical_result.macd.slow_period, "latest_signal": technical_result.macd.data[-1].signal if technical_result.macd.data else None},
                    "bollinger": {"period": technical_result.bollinger_bands.period, "latest_upper": technical_result.bollinger_bands.data[-1].upper if technical_result.bollinger_bands.data else None}
                }
            except Exception as e:
                logger.warning("Failed to get technical data for LLM", symbol=symbol, error=str(e))

        if include_fundamental:
            try:
                fundamental_result = await fundamental_service.get_fundamental_data(symbol.upper())
                fundamental_data = {
                    "pe_ratio": fundamental_result.data.ratios.pe_ratio,
                    "pb_ratio": fundamental_result.data.ratios.pb_ratio,
                    "market_cap": fundamental_result.data.market_cap,
                    "roe": fundamental_result.data.ratios.roe,
                    "debt_to_equity": fundamental_result.data.ratios.debt_to_equity
                }
            except Exception as e:
                logger.warning("Failed to get fundamental data for LLM", symbol=symbol, error=str(e))

        if include_sentiment:
            try:
                sentiment_result = await sentiment_service.analyze_sentiment(symbol.upper())
                sentiment_data = {
                    "overall_sentiment": sentiment_result.summary.overall_sentiment,
                    "confidence": sentiment_result.summary.average_confidence,
                    "sources_analyzed": sentiment_result.summary.sources_analyzed
                }
            except Exception as e:
                logger.warning("Failed to get sentiment data for LLM", symbol=symbol, error=str(e))

        if include_colombian:
            try:
                colombian_result = await colombian_market_service.analyze_colombian_market(symbol.upper())
                colombian_data = {
                    "trm_impact": colombian_result.trm_impact.impact_strength,
                    "bvc_pattern": colombian_result.bvc_pattern.pattern_type,
                    "market_context": colombian_result.market_context
                }
            except Exception as e:
                logger.warning("Failed to get Colombian market data for LLM", symbol=symbol, error=str(e))

        # Generate LLM insights
        result = await llm_service.generate_market_insights(
            symbol.upper(),
            technical_data=technical_data,
            fundamental_data=fundamental_data,
            sentiment_data=sentiment_data,
            colombian_market_data=colombian_data
        )

        return result

    except ValueError as e:
        logger.error("Error getting LLM insights", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting LLM insights", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/custom/{symbol}", response_model=LLMInsight)
async def get_custom_llm_insight(
    symbol: str,
    question: str = Query(..., description="Custom question to analyze", min_length=10, max_length=500)
):
    """
    Get custom LLM insight for a specific question about a symbol.

    Args:
        symbol: Stock symbol
        question: Custom question to analyze

    Returns:
        LLMInsight with custom analysis
    """
    try:
        logger.info("Getting custom LLM insight", symbol=symbol, question=question[:50])

        result = await llm_service.generate_custom_insight(symbol.upper(), question)

        if result:
            return result
        else:
            raise HTTPException(status_code=503, detail="LLM service unavailable")

    except ValueError as e:
        logger.error("Error getting custom LLM insight", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting custom LLM insight", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")