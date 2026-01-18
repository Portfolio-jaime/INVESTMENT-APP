"""API endpoints for comprehensive analysis combining all services."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import structlog

from app.schemas.indicators import ComprehensiveAnalysisResponse
from app.services.technical_indicators import indicator_service
from app.services.fundamental_analysis import fundamental_service
from app.services.sentiment_analysis import sentiment_service
from app.services.colombian_market import colombian_market_service
from app.services.llm_integration import llm_service

logger = structlog.get_logger()

router = APIRouter()


@router.get("/{symbol}", response_model=ComprehensiveAnalysisResponse)
async def get_comprehensive_analysis(
    symbol: str,
    include_fundamental: bool = Query(True, description="Include fundamental analysis"),
    include_sentiment: bool = Query(True, description="Include sentiment analysis"),
    include_colombian: bool = Query(True, description="Include Colombian market analysis"),
    include_llm: bool = Query(True, description="Include LLM insights")
):
    """
    Get comprehensive analysis combining all available analysis types.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL, ECOPETROL.CB)
        include_fundamental: Whether to include fundamental analysis
        include_sentiment: Whether to include sentiment analysis
        include_colombian: Whether to include Colombian market analysis
        include_llm: Whether to include LLM insights

    Returns:
        ComprehensiveAnalysisResponse with all analysis types
    """
    try:
        logger.info("Getting comprehensive analysis", symbol=symbol)

        # Always include technical analysis
        technical = await indicator_service.calculate_all_indicators(symbol.upper())

        # Initialize optional components
        fundamental = None
        sentiment = None
        colombian_market = None
        llm_insights = None

        # Gather data for LLM if needed
        technical_data = None
        fundamental_data = None
        sentiment_data = None
        colombian_data = None

        if include_fundamental:
            try:
                fundamental = await fundamental_service.get_fundamental_data(symbol.upper())
                fundamental_data = {
                    "pe_ratio": fundamental.data.ratios.pe_ratio,
                    "pb_ratio": fundamental.data.ratios.pb_ratio,
                    "market_cap": fundamental.data.market_cap,
                    "roe": fundamental.data.ratios.roe,
                    "debt_to_equity": fundamental.data.ratios.debt_to_equity
                }
            except Exception as e:
                logger.warning("Failed to get fundamental analysis", symbol=symbol, error=str(e))

        if include_sentiment:
            try:
                sentiment = await sentiment_service.analyze_sentiment(symbol.upper())
                sentiment_data = {
                    "overall_sentiment": sentiment.summary.overall_sentiment,
                    "confidence": sentiment.summary.average_confidence,
                    "sources_analyzed": sentiment.summary.sources_analyzed
                }
            except Exception as e:
                logger.warning("Failed to get sentiment analysis", symbol=symbol, error=str(e))

        if include_colombian:
            try:
                colombian_market = await colombian_market_service.analyze_colombian_market(symbol.upper())
                colombian_data = {
                    "trm_impact": colombian_market.trm_impact.impact_strength,
                    "bvc_pattern": colombian_market.bvc_pattern.pattern_type,
                    "market_context": colombian_market.market_context
                }
            except Exception as e:
                logger.warning("Failed to get Colombian market analysis", symbol=symbol, error=str(e))

        if include_llm:
            try:
                # Prepare technical data for LLM
                technical_data = {
                    "sma": {"period": technical.sma.period, "latest_value": technical.sma.data[-1].value if technical.sma.data else None},
                    "ema": {"period": technical.ema.period, "latest_value": technical.ema.data[-1].value if technical.ema.data else None},
                    "rsi": {"period": technical.rsi.period, "latest_value": technical.rsi.data[-1].value if technical.rsi.data else None},
                    "macd": {"fast": technical.macd.fast_period, "slow": technical.macd.slow_period, "latest_signal": technical.macd.data[-1].signal if technical.macd.data else None},
                    "bollinger": {"period": technical.bollinger_bands.period, "latest_upper": technical.bollinger_bands.data[-1].upper if technical.bollinger_bands.data else None}
                }

                llm_insights = await llm_service.generate_market_insights(
                    symbol.upper(),
                    technical_data=technical_data,
                    fundamental_data=fundamental_data,
                    sentiment_data=sentiment_data,
                    colombian_market_data=colombian_data
                )
            except Exception as e:
                logger.warning("Failed to get LLM insights", symbol=symbol, error=str(e))

        return ComprehensiveAnalysisResponse(
            symbol=symbol.upper(),
            technical=technical,
            fundamental=fundamental,
            sentiment=sentiment,
            colombian_market=colombian_market,
            llm_insights=llm_insights
        )

    except ValueError as e:
        logger.error("Error getting comprehensive analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting comprehensive analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")