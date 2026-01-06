"""API endpoints for fundamental analysis."""

from fastapi import APIRouter, HTTPException
import structlog

from app.schemas.indicators import FundamentalResponse
from app.services.fundamental_analysis import fundamental_service

logger = structlog.get_logger()

router = APIRouter()


@router.get("/{symbol}", response_model=FundamentalResponse)
async def get_fundamental_analysis(symbol: str):
    """
    Get fundamental analysis for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL, ECOPETROL.CB)

    Returns:
        FundamentalResponse with financial data and ratios
    """
    try:
        logger.info("Getting fundamental analysis", symbol=symbol)
        result = await fundamental_service.get_fundamental_data(symbol.upper())
        return result
    except ValueError as e:
        logger.error("Error getting fundamental analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error getting fundamental analysis", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")