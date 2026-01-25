"""Market quote database models."""

from sqlalchemy import Column, String, Float, BigInteger, DateTime, Index
from sqlalchemy.sql import func
from app.db.session import Base


class Quote(Base):
    """Real-time quote model."""
    
    __tablename__ = "quotes"
    
    id = Column(BigInteger, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(50), nullable=False)
    
    # Price data
    price = Column(Float, nullable=False)
    open_price = Column(Float)
    high = Column(Float)
    low = Column(Float)
    previous_close = Column(Float)
    
    # Change metrics
    change = Column(Float)
    change_percent = Column(Float)
    
    # Volume
    volume = Column(BigInteger)
    avg_volume = Column(BigInteger)
    
    # Market cap and shares
    market_cap = Column(BigInteger)
    shares_outstanding = Column(BigInteger)
    
    # Timestamps
    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('ix_quotes_symbol_timestamp', 'symbol', 'timestamp'),
        Index('ix_quotes_timestamp', 'timestamp'),
    )


class HistoricalPrice(Base):
    """Historical price data model (OHLCV)."""
    
    __tablename__ = "historical_prices"
    
    id = Column(BigInteger, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(50), nullable=False)
    
    # OHLCV data
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    
    # Adjusted prices
    adjusted_close = Column(Float)
    
    # Timeframe (1d, 1h, 5m, etc.)
    timeframe = Column(String(10), nullable=False, default='1d')
    
    # Timestamps
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('ix_historical_symbol_date', 'symbol', 'date'),
        Index('ix_historical_symbol_timeframe_date', 'symbol', 'timeframe', 'date'),
    )
