"""Pydantic schemas for recommendation responses."""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TechnicalIndicators(BaseModel):
    """Technical indicators data."""
    rsi: Optional[float] = Field(None, description="RSI value (0-100)")
    macd: Optional[Dict[str, float]] = Field(None, description="MACD data with macd, signal, histogram")
    volume: int = Field(..., description="Trading volume")
    price_change_pct: float = Field(..., description="Price change percentage")
    sma_3: Optional[float] = Field(None, description="3-day simple moving average")
    sma_10: Optional[float] = Field(None, description="10-day simple moving average")
    sma_20: Optional[float] = Field(None, description="20-day simple moving average")
    ema_12: Optional[float] = Field(None, description="12-day exponential moving average")
    ema_26: Optional[float] = Field(None, description="26-day exponential moving average")
    bollinger_upper: Optional[float] = Field(None, description="Bollinger band upper")
    bollinger_lower: Optional[float] = Field(None, description="Bollinger band lower")
    bollinger_position: Optional[float] = Field(None, description="Position within Bollinger bands (0-1)")


class MLPrediction(BaseModel):
    """Machine learning prediction data."""
    predicted_price_1d: Optional[float] = Field(None, description="1-day ahead price prediction")
    predicted_price_5d: Optional[float] = Field(None, description="5-day ahead price prediction")
    predicted_price_10d: Optional[float] = Field(None, description="10-day ahead price prediction")
    trend: str = Field(..., description="Predicted trend (bullish, bearish, neutral)")
    trend_confidence: float = Field(..., description="Trend prediction confidence (0-100)")
    price_volatility: float = Field(..., description="Predicted volatility percentage")
    lstm_score: Optional[float] = Field(None, description="LSTM model score contribution")
    rf_classification: Optional[str] = Field(None, description="Random Forest classification (BUY/HOLD/SELL)")
    xgb_confidence: Optional[float] = Field(None, description="XGBoost confidence score")


class MomentumIndicators(BaseModel):
    """Momentum-specific indicators."""
    velocity: float = Field(..., description="Price velocity (rate of change)")
    acceleration: float = Field(..., description="Price acceleration")
    slope: float = Field(..., description="Price trend slope")
    volatility: float = Field(..., description="Price volatility percentage")


class RecommendationResponse(BaseModel):
    """Investment recommendation response."""
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    signal: str = Field(..., description="Trading signal: BUY, HOLD, or AVOID")
    score: float = Field(..., description="Recommendation score (-10 to +10)")
    confidence: float = Field(..., description="Confidence level (0-100%)")
    reasons: List[str] = Field(..., description="Human-readable reasons for recommendation")
    indicators: TechnicalIndicators = Field(..., description="Technical indicators used")
    ml_prediction: Optional[MLPrediction] = Field(None, description="Machine learning predictions")
    momentum: Optional[MomentumIndicators] = Field(None, description="Momentum indicators")
    current_price: float = Field(..., description="Current stock price")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Recommendation timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "signal": "BUY",
                "score": 7.5,
                "confidence": 85.0,
                "reasons": [
                    "+3.2% strong bullish momentum",
                    "High volume (120.5M, +45% vs avg)",
                    "RSI 42 (neutral zone)",
                    "MACD bullish crossover"
                ],
                "indicators": {
                    "rsi": 42.3,
                    "macd": {"macd": 1.2, "signal": 0.8, "histogram": 0.4},
                    "volume": 120500000,
                    "price_change_pct": 3.2,
                    "sma_3": 175.20,
                    "sma_10": 172.50
                },
                "ml_prediction": {
                    "predicted_price_5d": 180.50,
                    "trend": "bullish",
                    "trend_confidence": 82.5,
                    "price_volatility": 2.1
                },
                "current_price": 178.45,
                "timestamp": "2026-01-04T17:00:00Z"
            }
        }


class BatchRecommendationRequest(BaseModel):
    """Request for batch recommendations."""
    symbols: List[str] = Field(..., description="List of stock symbols", min_length=1, max_length=50)
    include_ml_predictions: bool = Field(default=True, description="Include ML predictions in response")


class BatchRecommendationResponse(BaseModel):
    """Batch recommendation response."""
    recommendations: List[RecommendationResponse] = Field(..., description="List of recommendations")
    total: int = Field(..., description="Total number of recommendations")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Batch timestamp")
