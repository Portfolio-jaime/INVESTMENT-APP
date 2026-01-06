"""Pydantic schemas for prediction requests and responses."""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """Base prediction request schema."""

    days_history: int = Field(
        default=60,
        ge=30,
        le=365,
        description="Number of days of historical data to use"
    )


class PricePredictionResponse(BaseModel):
    """Price prediction response schema."""

    symbol: str
    current_price: float
    predicted_price: float
    predicted_change_percent: float
    confidence: float = Field(ge=0.0, le=1.0)
    prediction_date: datetime
    model_used: str

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "current_price": 175.50,
                "predicted_price": 178.25,
                "predicted_change_percent": 1.57,
                "confidence": 0.72,
                "prediction_date": "2025-12-17T00:00:00Z",
                "model_used": "linear_regression"
            }
        }


class SignalType(str):
    """Trading signal types."""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class SignalPredictionResponse(BaseModel):
    """Buy/Sell signal prediction response schema."""

    symbol: str
    signal: Literal["buy", "sell", "hold"]
    strength: float = Field(ge=0.0, le=1.0, description="Signal strength (0-1)")
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: dict
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "signal": "buy",
                "strength": 0.75,
                "confidence": 0.68,
                "reasoning": {
                    "rsi": 28.5,
                    "rsi_signal": "oversold",
                    "macd_trend": "bullish",
                    "price_trend": "upward"
                },
                "timestamp": "2025-12-16T12:00:00Z"
            }
        }


class TrendType(str):
    """Trend types."""
    UP = "up"
    DOWN = "down"
    NEUTRAL = "neutral"


class TrendPredictionResponse(BaseModel):
    """Trend prediction response schema."""

    symbol: str
    trend: Literal["up", "down", "neutral"]
    trend_strength: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    momentum_indicators: dict
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "AAPL",
                "trend": "up",
                "trend_strength": 0.65,
                "confidence": 0.70,
                "momentum_indicators": {
                    "sma_3": 176.20,
                    "sma_10": 174.80,
                    "slope": 0.47,
                    "volatility": 2.3
                },
                "timestamp": "2025-12-16T12:00:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response schema."""

    error: str
    detail: Optional[str] = None
    timestamp: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Insufficient data",
                "detail": "Need at least 30 days of historical data for prediction",
                "timestamp": "2025-12-16T12:00:00Z"
            }
        }
