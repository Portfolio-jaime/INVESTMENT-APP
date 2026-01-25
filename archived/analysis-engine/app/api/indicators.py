"""API endpoints for technical indicators."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import structlog

from app.schemas.indicators import (
    SMAResponse,
    EMAResponse,
    RSIResponse,
    MACDResponse,
    BollingerBandsResponse,
    AllIndicatorsResponse,
    ErrorResponse
)
from app.services.technical_indicators import indicator_service
from app.core.config import settings

logger = structlog.get_logger()

router = APIRouter()


@router.get("/sma/{symbol}", response_model=SMAResponse)
async def get_sma(
    symbol: str,
    period: Optional[int] = Query(
        None,
        description="SMA period",
        ge=1,
        le=200
    )
):
    """
    Calculate Simple Moving Average for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        period: SMA period (default: 20)

    Returns:
        SMAResponse with calculated values
    """
    try:
        logger.info("Calculating SMA", symbol=symbol, period=period)
        result = await indicator_service.calculate_sma(symbol.upper(), period)
        return result
    except ValueError as e:
        logger.error("Error calculating SMA", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating SMA", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/ema/{symbol}", response_model=EMAResponse)
async def get_ema(
    symbol: str,
    period: Optional[int] = Query(
        None,
        description="EMA period",
        ge=1,
        le=200
    )
):
    """
    Calculate Exponential Moving Average for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        period: EMA period (default: 20)

    Returns:
        EMAResponse with calculated values
    """
    try:
        logger.info("Calculating EMA", symbol=symbol, period=period)
        result = await indicator_service.calculate_ema(symbol.upper(), period)
        return result
    except ValueError as e:
        logger.error("Error calculating EMA", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating EMA", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/rsi/{symbol}", response_model=RSIResponse)
async def get_rsi(
    symbol: str,
    period: Optional[int] = Query(
        None,
        description="RSI period",
        ge=1,
        le=200
    )
):
    """
    Calculate Relative Strength Index for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        period: RSI period (default: 14)

    Returns:
        RSIResponse with calculated values
    """
    try:
        logger.info("Calculating RSI", symbol=symbol, period=period)
        result = await indicator_service.calculate_rsi(symbol.upper(), period)
        return result
    except ValueError as e:
        logger.error("Error calculating RSI", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating RSI", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/macd/{symbol}", response_model=MACDResponse)
async def get_macd(
    symbol: str,
    fast: Optional[int] = Query(
        None,
        description="Fast period",
        ge=1,
        le=50
    ),
    slow: Optional[int] = Query(
        None,
        description="Slow period",
        ge=1,
        le=100
    ),
    signal: Optional[int] = Query(
        None,
        description="Signal period",
        ge=1,
        le=50
    )
):
    """
    Calculate MACD (Moving Average Convergence Divergence) for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        fast: Fast period (default: 12)
        slow: Slow period (default: 26)
        signal: Signal period (default: 9)

    Returns:
        MACDResponse with calculated values
    """
    try:
        logger.info("Calculating MACD", symbol=symbol, fast=fast, slow=slow, signal=signal)
        result = await indicator_service.calculate_macd(symbol.upper(), fast, slow, signal)
        return result
    except ValueError as e:
        logger.error("Error calculating MACD", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating MACD", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/bollinger/{symbol}", response_model=BollingerBandsResponse)
async def get_bollinger_bands(
    symbol: str,
    period: Optional[int] = Query(
        None,
        description="Period for moving average",
        ge=1,
        le=200
    ),
    std_dev: Optional[float] = Query(
        None,
        description="Standard deviation multiplier",
        ge=0.1,
        le=5.0
    )
):
    """
    Calculate Bollinger Bands for a symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)
        period: Period for moving average (default: 20)
        std_dev: Standard deviation multiplier (default: 2.0)

    Returns:
        BollingerBandsResponse with calculated values
    """
    try:
        logger.info("Calculating Bollinger Bands", symbol=symbol, period=period, std_dev=std_dev)
        result = await indicator_service.calculate_bollinger_bands(symbol.upper(), period, std_dev)
        return result
    except ValueError as e:
        logger.error("Error calculating Bollinger Bands", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating Bollinger Bands", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all/{symbol}", response_model=AllIndicatorsResponse)
async def get_all_indicators(symbol: str):
    """
    Calculate all technical indicators for a symbol.

    This endpoint returns SMA, EMA, RSI, MACD, and Bollinger Bands
    with default parameters for the specified symbol.

    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL)

    Returns:
        AllIndicatorsResponse with all calculated indicators
    """
    try:
        logger.info("Calculating all indicators", symbol=symbol)
        result = await indicator_service.calculate_all_indicators(symbol.upper())
        return result
    except ValueError as e:
        logger.error("Error calculating all indicators", symbol=symbol, error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error calculating all indicators", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
