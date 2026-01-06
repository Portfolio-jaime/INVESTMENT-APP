"""Pydantic schemas for quotes."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class QuoteBase(BaseModel):
    """Base quote schema."""
    symbol: str = Field(..., max_length=20)
    exchange: str
    price: float
    open_price: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    previous_close: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    market_cap: Optional[int] = None
    shares_outstanding: Optional[int] = None
    timestamp: datetime


class QuoteResponse(QuoteBase):
    """Quote response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class HistoricalPriceBase(BaseModel):
    """Base historical price schema."""
    symbol: str
    exchange: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None
    timeframe: str = '1d'
    date: datetime


class HistoricalPriceResponse(HistoricalPriceBase):
    """Historical price response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuoteSearchResponse(BaseModel):
    """Symbol search response."""
    symbol: str
    name: str
    exchange: str
    type: str  # stock, etf, index
    currency: str
    country: str
