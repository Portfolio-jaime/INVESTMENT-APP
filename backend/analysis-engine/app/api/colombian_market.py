"""API endpoints for Colombian market analysis."""

from fastapi import APIRouter, HTTPException
import structlog

from app.schemas.indicators import ColombianMarketResponse
from app.services.colombian_market import colombian_market_service

logger = structlog.get_logger()

router = APIRouter()


@router.get("/{symbol}", response_model=ColombianMarketResponse)
async def get_colombian_market_analysis(symbol: str):
    """
    Get Colombian market analysis for a symbol.

    Includes TRM impact analysis and BVC market patterns.

    Args:
        symbol: Stock symbol (e.g., ECOPETROL.CB, BANCOLOMBIA.CB)

    Returns:
        ColombianMarketResponse with market analysis
    """
    try:
        logger.info("Getting Colombian market analysis", symbol=symbol)
        result = await colombian_market_service.analyze_colombian_market(symbol.upper())
        return result
    except ValueError as e:
        logger.error("Error getting Colombian market analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting Colombian market analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/indicators/current")
async def get_colombian_market_indicators():
    """
    Get current Colombian market indicators.

    Returns TRM rate and BVC index data.
    """
    try:
        logger.info("Getting Colombian market indicators")
        result = await colombian_market_service.get_colombian_market_indicators()
        return result
    except Exception as e:
        logger.error("Error getting Colombian market indicators", error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")