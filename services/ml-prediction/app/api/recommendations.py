"""Investment recommendations API endpoints."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional
import httpx
import structlog
from datetime import datetime

from app.schemas.recommendations import (
    RecommendationResponse,
    TechnicalIndicators,
    MLPrediction,
    MomentumIndicators,
    BatchRecommendationRequest,
    BatchRecommendationResponse
)
from app.core.config import settings
from app.core.scoring import score_calculator
from app.models.predictor import predictor

logger = structlog.get_logger()
router = APIRouter()


async def fetch_market_data(symbol: str, days: int = 60) -> List[Dict]:
    """
    Fetch historical market data from market-data service.

    Args:
        symbol: Stock symbol
        days: Number of days of historical data

    Returns:
        List of historical price data

    Raises:
        HTTPException: If market data service is unavailable
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.MARKET_DATA_SERVICE_URL}/api/v1/market-data/{symbol}/history",
                params={"days": days}
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
    except httpx.HTTPError as e:
        logger.error("Failed to fetch market data", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=503,
            detail=f"Market data service unavailable: {str(e)}"
        )


async def fetch_technical_indicators(symbol: str) -> Dict:
    """
    Fetch technical indicators from analysis-engine service.

    Args:
        symbol: Stock symbol

    Returns:
        Dictionary with RSI, MACD, and other indicators

    Raises:
        HTTPException: If analysis engine is unavailable
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch RSI
            rsi_response = await client.get(
                f"{settings.ANALYSIS_ENGINE_URL}/api/v1/indicators/rsi/{symbol}"
            )
            rsi_data = rsi_response.json() if rsi_response.status_code == 200 else {}

            # Fetch MACD
            macd_response = await client.get(
                f"{settings.ANALYSIS_ENGINE_URL}/api/v1/indicators/macd/{symbol}"
            )
            macd_data = macd_response.json() if macd_response.status_code == 200 else {}

            # Fetch Moving Averages
            sma_response = await client.get(
                f"{settings.ANALYSIS_ENGINE_URL}/api/v1/indicators/sma/{symbol}",
                params={"periods": "3,10,20"}
            )
            sma_data = sma_response.json() if sma_response.status_code == 200 else {}

            # Fetch Bollinger Bands
            bb_response = await client.get(
                f"{settings.ANALYSIS_ENGINE_URL}/api/v1/indicators/bollinger/{symbol}"
            )
            bb_data = bb_response.json() if bb_response.status_code == 200 else {}

            return {
                'rsi': rsi_data,
                'macd': macd_data,
                'sma': sma_data,
                'bollinger': bb_data
            }
    except httpx.HTTPError as e:
        logger.warning("Failed to fetch technical indicators", symbol=symbol, error=str(e))
        # Return empty dict instead of failing - we can still make recommendations
        return {}


async def fetch_current_price(symbol: str) -> Dict:
    """
    Fetch current price and volume from market-data service.

    Args:
        symbol: Stock symbol

    Returns:
        Dictionary with current price and volume

    Raises:
        HTTPException: If market data service is unavailable
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.MARKET_DATA_SERVICE_URL}/api/v1/market-data/{symbol}/quote"
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error("Failed to fetch current price", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=503,
            detail=f"Market data service unavailable: {str(e)}"
        )


def generate_ml_prediction(historical_data: List[Dict], symbol: str) -> Optional[MLPrediction]:
    """
    Generate ML-based predictions using existing predictor models.

    Args:
        historical_data: List of historical price data
        symbol: Stock symbol

    Returns:
        MLPrediction object or None if prediction fails
    """
    try:
        # Use existing predictor for trend analysis
        trend, trend_strength, confidence, momentum = predictor.predict_trend(
            historical_data,
            window=5
        )

        # Calculate volatility from historical data
        if len(historical_data) >= 20:
            import numpy as np
            prices = [d.get('close', 0) for d in historical_data[-20:]]
            returns = np.diff(prices) / prices[:-1]
            volatility = float(np.std(returns) * 100)
        else:
            volatility = 0.0

        # Try to predict future prices
        try:
            price_1d, conf_1d = predictor.predict_price(historical_data, days_ahead=1)
            price_5d, conf_5d = predictor.predict_price(historical_data, days_ahead=5)
            price_10d, conf_10d = predictor.predict_price(historical_data, days_ahead=10)
        except Exception as e:
            logger.warning("Price prediction failed", symbol=symbol, error=str(e))
            price_1d = price_5d = price_10d = None

        return MLPrediction(
            predicted_price_1d=price_1d,
            predicted_price_5d=price_5d,
            predicted_price_10d=price_10d,
            trend=trend,
            trend_confidence=confidence * 100,
            price_volatility=volatility
        )
    except Exception as e:
        logger.error("ML prediction failed", symbol=symbol, error=str(e))
        return None


@router.get("/{symbol}", response_model=RecommendationResponse)
async def get_recommendation(
    symbol: str,
    include_ml: bool = Query(default=True, description="Include ML predictions")
) -> RecommendationResponse:
    """
    Get investment recommendation for a specific symbol.

    This endpoint provides a comprehensive investment recommendation combining:
    - Multi-factor scoring (momentum, volume, RSI, MACD)
    - Technical indicators
    - Machine learning predictions
    - Human-readable reasoning

    Args:
        symbol: Stock ticker symbol (e.g., AAPL, MSFT)
        include_ml: Whether to include ML predictions (default: True)

    Returns:
        RecommendationResponse with signal (BUY/HOLD/AVOID), score, confidence, and analysis

    Raises:
        HTTPException: If data cannot be fetched or symbol is invalid
    """
    symbol = symbol.upper()

    logger.info("Generating recommendation", symbol=symbol)

    # Fetch all required data in parallel
    try:
        # Fetch current price and volume
        quote_data = await fetch_current_price(symbol)
        current_price = quote_data.get('price', 0)
        current_volume = quote_data.get('volume', 0)

        if current_price == 0:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found or price is zero")

        # Fetch historical data
        historical_data = await fetch_market_data(symbol, days=60)

        if not historical_data:
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")

        # Fetch technical indicators
        indicators_data = await fetch_technical_indicators(symbol)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch data for recommendation", symbol=symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")

    # Extract technical indicators
    rsi_value = indicators_data.get('rsi', {}).get('value')
    macd_data = indicators_data.get('macd', {})
    sma_data = indicators_data.get('sma', {})
    bb_data = indicators_data.get('bollinger', {})

    # Calculate price change percentage
    if len(historical_data) > 0:
        prev_close = historical_data[-1].get('close', current_price)
        price_change_pct = ((current_price - prev_close) / prev_close) * 100 if prev_close > 0 else 0
    else:
        price_change_pct = 0

    # Calculate comprehensive score using multi-factor algorithm
    signal, score, confidence, reasons = score_calculator.calculate_comprehensive_score(
        historical_data=historical_data,
        current_price=current_price,
        current_volume=current_volume,
        rsi=rsi_value,
        macd_data=macd_data
    )

    # Build technical indicators response
    technical_indicators = TechnicalIndicators(
        rsi=rsi_value,
        macd=macd_data,
        volume=current_volume,
        price_change_pct=price_change_pct,
        sma_3=sma_data.get('sma_3'),
        sma_10=sma_data.get('sma_10'),
        sma_20=sma_data.get('sma_20'),
        bollinger_upper=bb_data.get('upper'),
        bollinger_lower=bb_data.get('lower'),
        bollinger_position=bb_data.get('position')
    )

    # Generate ML predictions if requested
    ml_prediction = None
    if include_ml:
        ml_prediction = generate_ml_prediction(historical_data, symbol)

    # Calculate momentum indicators
    if len(historical_data) >= 10:
        import numpy as np
        prices = [d.get('close', 0) for d in historical_data[-10:]]
        velocities = np.diff(prices)
        velocity = float(np.mean(velocities))
        acceleration = float(np.mean(np.diff(velocities))) if len(velocities) > 1 else 0.0

        # Calculate slope using linear regression
        x = np.arange(len(prices))
        slope = float(np.polyfit(x, prices, 1)[0])

        # Calculate volatility
        returns = np.diff(prices) / prices[:-1]
        volatility = float(np.std(returns) * 100)

        momentum = MomentumIndicators(
            velocity=velocity,
            acceleration=acceleration,
            slope=slope,
            volatility=volatility
        )
    else:
        momentum = None

    response = RecommendationResponse(
        symbol=symbol,
        signal=signal,
        score=score,
        confidence=confidence,
        reasons=reasons,
        indicators=technical_indicators,
        ml_prediction=ml_prediction,
        momentum=momentum,
        current_price=current_price,
        timestamp=datetime.utcnow()
    )

    logger.info(
        "Recommendation generated successfully",
        symbol=symbol,
        signal=signal,
        score=score,
        confidence=confidence
    )

    return response


@router.post("/batch", response_model=BatchRecommendationResponse)
async def get_batch_recommendations(
    request: BatchRecommendationRequest
) -> BatchRecommendationResponse:
    """
    Get recommendations for multiple symbols in batch.

    This endpoint efficiently fetches recommendations for multiple stocks
    by processing requests in parallel.

    Args:
        request: BatchRecommendationRequest with list of symbols

    Returns:
        BatchRecommendationResponse with all recommendations

    Raises:
        HTTPException: If batch processing fails
    """
    logger.info("Processing batch recommendation request", symbols=request.symbols)

    recommendations = []
    errors = []

    # Process each symbol
    for symbol in request.symbols:
        try:
            recommendation = await get_recommendation(symbol, include_ml=request.include_ml_predictions)
            recommendations.append(recommendation)
        except Exception as e:
            logger.warning("Failed to get recommendation for symbol", symbol=symbol, error=str(e))
            errors.append({"symbol": symbol, "error": str(e)})

    if not recommendations and errors:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate any recommendations. Errors: {errors}"
        )

    response = BatchRecommendationResponse(
        recommendations=recommendations,
        total=len(recommendations),
        timestamp=datetime.utcnow()
    )

    logger.info(
        "Batch recommendations generated",
        total=len(recommendations),
        errors=len(errors)
    )

    return response


@router.get("/")
async def recommendations_info():
    """
    Get information about the recommendations API.

    Returns:
        Dictionary with API information and usage examples
    """
    return {
        "service": "Investment Recommendations API",
        "version": "2.0.0",
        "description": "Advanced investment recommendations using multi-factor analysis and ML",
        "endpoints": {
            "single_recommendation": "GET /{symbol}",
            "batch_recommendations": "POST /batch"
        },
        "scoring_algorithm": {
            "weights": {
                "momentum": "40%",
                "volume": "20%",
                "rsi": "20%",
                "macd": "20%"
            },
            "score_range": "-10 to +10",
            "signals": ["BUY (score >= 5)", "HOLD (score >= -1)", "AVOID (score < -1)"]
        },
        "features": [
            "Multi-factor scoring algorithm",
            "Technical indicators (RSI, MACD, SMA, Bollinger Bands)",
            "Machine learning predictions (trend, price, volatility)",
            "Momentum analysis (velocity, acceleration)",
            "Human-readable reasoning",
            "Batch processing support"
        ],
        "example_usage": {
            "single": "/api/v1/recommendations/AAPL",
            "batch": "/api/v1/recommendations/batch"
        }
    }
