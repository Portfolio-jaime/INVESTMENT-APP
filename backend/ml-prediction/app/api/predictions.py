"""Prediction API endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
import httpx
import structlog

from app.core.config import settings
from app.schemas.predictions import (
    PredictionRequest,
    PricePredictionResponse,
    SignalPredictionResponse,
    TrendPredictionResponse,
    ErrorResponse
)
from app.models.predictor import predictor

logger = structlog.get_logger()

router = APIRouter()


async def fetch_market_data(symbol: str, days: int = 60):
    """
    Fetch historical market data from Market Data Service.

    Args:
        symbol: Stock symbol
        days: Number of days of historical data

    Returns:
        List of historical price data

    Raises:
        HTTPException: If data cannot be fetched
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.MARKET_DATA_SERVICE_URL}/api/v1/market-data/quotes/{symbol}/historical",
                params={"days": days}
            )
            response.raise_for_status()
            data = response.json()

            # Extract price history
            if 'data' in data:
                return data['data']
            return data

    except httpx.HTTPError as e:
        logger.error(
            "Failed to fetch market data",
            symbol=symbol,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot fetch market data: {str(e)}"
        )


async def fetch_technical_indicators(symbol: str, indicator: str):
    """
    Fetch technical indicators from Analysis Engine.

    Args:
        symbol: Stock symbol
        indicator: Indicator name (rsi, macd, etc.)

    Returns:
        Indicator data

    Raises:
        HTTPException: If data cannot be fetched
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.ANALYSIS_ENGINE_URL}/api/v1/indicators/{indicator}/{symbol}"
            )
            response.raise_for_status()
            return response.json()

    except httpx.HTTPError as e:
        logger.warning(
            "Failed to fetch technical indicator",
            symbol=symbol,
            indicator=indicator,
            error=str(e)
        )
        return None


@router.post(
    "/price/{symbol}",
    response_model=PricePredictionResponse,
    summary="Predict next day price",
    description="Predict the next trading day's closing price using linear regression"
)
async def predict_price(
    symbol: str,
    days_history: int = Query(default=60, ge=30, le=365, description="Days of historical data to use")
):
    """
    Predict the next day's closing price for a given symbol.

    Uses linear regression on historical price data with moving averages.
    """
    logger.info("Price prediction request", symbol=symbol, days=days_history)

    try:
        # Fetch historical data
        historical_data = await fetch_market_data(symbol, days_history)

        if not historical_data or len(historical_data) < settings.MIN_TRAINING_SAMPLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data. Need at least {settings.MIN_TRAINING_SAMPLES} days"
            )

        # Get current price
        current_price = historical_data[-1]['close']

        # Predict price
        predicted_price, confidence = predictor.predict_price(
            historical_data,
            days_ahead=settings.PREDICTION_WINDOW
        )

        # Calculate change percentage
        price_change = ((predicted_price - current_price) / current_price) * 100

        return PricePredictionResponse(
            symbol=symbol.upper(),
            current_price=current_price,
            predicted_price=predicted_price,
            predicted_change_percent=round(price_change, 2),
            confidence=round(confidence, 2),
            prediction_date=datetime.utcnow(),
            model_used="linear_regression"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Price prediction error", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post(
    "/signal/{symbol}",
    response_model=SignalPredictionResponse,
    summary="Get trading signal",
    description="Generate buy/sell/hold signal based on RSI and MACD indicators"
)
async def predict_signal(
    symbol: str,
    days_history: int = Query(default=60, ge=30, le=365, description="Days of historical data to use")
):
    """
    Generate a trading signal (buy/sell/hold) for a given symbol.

    Uses RSI and MACD indicators to determine the signal.
    """
    logger.info("Signal prediction request", symbol=symbol)

    try:
        # Fetch current price
        historical_data = await fetch_market_data(symbol, days_history)

        if not historical_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot fetch market data"
            )

        current_price = historical_data[-1]['close']

        # Fetch RSI
        rsi_data = await fetch_technical_indicators(symbol, "rsi")
        rsi = None
        if rsi_data and 'data' in rsi_data and 'values' in rsi_data['data']:
            values = rsi_data['data']['values']
            if values:
                rsi = values[-1]

        # Fetch MACD
        macd_data = await fetch_technical_indicators(symbol, "macd")
        macd = None
        if macd_data and 'data' in macd_data:
            macd = macd_data['data']

        # Generate signal
        signal, strength, confidence, reasoning = predictor.predict_signal(
            current_price,
            rsi,
            macd
        )

        return SignalPredictionResponse(
            symbol=symbol.upper(),
            signal=signal,
            strength=round(strength, 2),
            confidence=round(confidence, 2),
            reasoning=reasoning,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Signal prediction error", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signal prediction failed: {str(e)}"
        )


@router.post(
    "/trend/{symbol}",
    response_model=TrendPredictionResponse,
    summary="Predict price trend",
    description="Predict if the price trend is up/down/neutral using moving average analysis"
)
async def predict_trend(
    symbol: str,
    days_history: int = Query(default=60, ge=10, le=365, description="Days of historical data to use"),
    window: int = Query(default=3, ge=3, le=10, description="Window for trend calculation")
):
    """
    Predict the price trend (up/down/neutral) for a given symbol.

    Uses moving average slope analysis to determine trend direction.
    """
    logger.info("Trend prediction request", symbol=symbol, window=window)

    try:
        # Fetch historical data
        historical_data = await fetch_market_data(symbol, days_history)

        if not historical_data or len(historical_data) < window:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data. Need at least {window} days"
            )

        # Predict trend
        trend, trend_strength, confidence, momentum = predictor.predict_trend(
            historical_data,
            window=window
        )

        return TrendPredictionResponse(
            symbol=symbol.upper(),
            trend=trend,
            trend_strength=round(trend_strength, 2),
            confidence=round(confidence, 2),
            momentum_indicators=momentum,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Trend prediction error", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trend prediction failed: {str(e)}"
        )
