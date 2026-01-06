"""Pydantic schemas for technical indicators."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PriceData(BaseModel):
    """Historical price data point."""
    timestamp: datetime
    close: float
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[float] = None


class IndicatorDataPoint(BaseModel):
    """Single indicator data point."""
    timestamp: datetime
    value: float


class SMAResponse(BaseModel):
    """Simple Moving Average response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class EMAResponse(BaseModel):
    """Exponential Moving Average response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class RSIResponse(BaseModel):
    """Relative Strength Index response."""
    symbol: str
    period: int
    data: List[IndicatorDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class MACDDataPoint(BaseModel):
    """MACD data point with three lines."""
    timestamp: datetime
    macd: float
    signal: float
    histogram: float


class MACDResponse(BaseModel):
    """MACD indicator response."""
    symbol: str
    fast_period: int
    slow_period: int
    signal_period: int
    data: List[MACDDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class BollingerBandsDataPoint(BaseModel):
    """Bollinger Bands data point."""
    timestamp: datetime
    upper: float
    middle: float
    lower: float
    bandwidth: Optional[float] = None


class BollingerBandsResponse(BaseModel):
    """Bollinger Bands response."""
    symbol: str
    period: int
    std_dev: float
    data: List[BollingerBandsDataPoint]
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class AllIndicatorsResponse(BaseModel):
    """Response containing all technical indicators."""
    symbol: str
    sma: SMAResponse
    ema: EMAResponse
    rsi: RSIResponse
    macd: MACDResponse
    bollinger_bands: BollingerBandsResponse
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    status_code: int
