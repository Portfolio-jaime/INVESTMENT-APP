"""Quote API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timedelta

from app.db.session import get_db
from app.schemas.quote import QuoteResponse, HistoricalPriceResponse, QuoteSearchResponse
from app.services.alpha_vantage import MarketDataClient, AlphaVantageClient
from app.services.cache_service import cache_service
from app.models.quote import Quote, HistoricalPrice
from sqlalchemy import select, and_
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/quotes/{symbol}", response_model=QuoteResponse)
async def get_quote(
    symbol: str,
    db: AsyncSession = Depends(get_db)
):
    """Get real-time quote for a symbol."""
    symbol = symbol.upper()
    
    # Try cache first
    cached_quote = await cache_service.get_quote(symbol)
    if cached_quote:
        logger.info("Quote cache hit", symbol=symbol)
        return cached_quote
    
    # Fetch from market data providers
    client = MarketDataClient()
    quote_data = await client.get_quote(symbol)
    if not quote_data:
        raise HTTPException(status_code=404, detail=f"Quote not found for symbol: {symbol}")

    # Save to database
    quote = Quote(**quote_data.dict())
    db.add(quote)
    await db.commit()
    await db.refresh(quote)

    # Cache the result
    quote_dict = {
        "id": quote.id,
        "symbol": quote.symbol,
        "exchange": quote.exchange,
        "price": quote.price,
        "open_price": quote.open_price,
        "high": quote.high,
        "low": quote.low,
        "previous_close": quote.previous_close,
        "change": quote.change,
        "change_percent": quote.change_percent,
        "volume": quote.volume,
        "avg_volume": quote.avg_volume,
        "market_cap": quote.market_cap,
        "shares_outstanding": quote.shares_outstanding,
        "timestamp": quote.timestamp.isoformat(),
        "created_at": quote.created_at.isoformat()
    }
    await cache_service.set_quote(symbol, quote_dict, ttl=60)

    return quote


@router.get("/quotes/{symbol}/historical", response_model=List[HistoricalPriceResponse])
async def get_historical_data(
    symbol: str,
    timeframe: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    limit: int = Query(100, ge=1, le=5000),
    db: AsyncSession = Depends(get_db)
):
    """Get historical price data."""
    symbol = symbol.upper()
    
    # Try cache first
    cached_data = await cache_service.get_historical(symbol, timeframe)
    if cached_data:
        logger.info("Historical data cache hit", symbol=symbol, timeframe=timeframe)
        return cached_data[:limit]
    
    # Check database first
    query = select(HistoricalPrice).where(
        and_(
            HistoricalPrice.symbol == symbol,
            HistoricalPrice.timeframe == timeframe[0] + "d"
        )
    ).order_by(HistoricalPrice.date.desc()).limit(limit)
    
    result = await db.execute(query)
    db_data = result.scalars().all()
    
    if db_data:
        logger.info("Historical data from database", symbol=symbol, count=len(db_data))
        return list(db_data)
    
    # Fetch from market data providers
    client = MarketDataClient()
    historical_data = await client.get_historical_data(symbol, timeframe, limit)
    if not historical_data:
        raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")

    # Save to database
    for price_data in historical_data:
        price = HistoricalPrice(**price_data.dict())
        db.add(price)

    await db.commit()

    # Cache the result
    historical_dict = [
        {
            "symbol": p.symbol,
            "exchange": p.exchange,
            "open": p.open,
            "high": p.high,
            "low": p.low,
            "close": p.close,
            "volume": p.volume,
            "adjusted_close": p.adjusted_close,
            "timeframe": p.timeframe,
            "date": p.date.isoformat()
        } for p in historical_data[:limit]
    ]
    await cache_service.set_historical(symbol, timeframe, historical_dict, ttl=3600)

    return historical_data[:limit]


@router.get("/search", response_model=List[QuoteSearchResponse])
async def search_symbols(
    query: str = Query(..., min_length=1),
):
    """Search for symbols."""
    client = AlphaVantageClient()
    try:
        results = await client.search_symbols(query)
        return results
    finally:
        await client.close()
