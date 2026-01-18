"""Broker API endpoints."""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.quote import QuoteResponse, HistoricalPriceResponse
from app.services.broker_integration import broker_service
import structlog

logger = structlog.get_logger()
router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


@router.get("/brokers/{broker_name}/quotes/{symbol}", response_model=QuoteResponse)
@limiter.limit("30/minute")  # Stricter limit for broker data
async def get_broker_quote(
    request: Request,
    broker_name: str,
    symbol: str
):
    """Get real-time quote from specific broker."""
    symbol = symbol.upper()

    quote_data = await broker_service.get_quote_from_broker(broker_name, symbol)
    if not quote_data:
        raise HTTPException(
            status_code=404,
            detail=f"Quote not found for symbol: {symbol} on broker: {broker_name}"
        )

    # Convert to response format
    return QuoteResponse(
        id=0,  # Broker data might not have IDs
        symbol=quote_data.symbol,
        exchange=quote_data.exchange,
        price=quote_data.price,
        open_price=quote_data.open_price,
        high=quote_data.high,
        low=quote_data.low,
        previous_close=quote_data.previous_close,
        change=quote_data.change,
        change_percent=quote_data.change_percent,
        volume=quote_data.volume,
        avg_volume=quote_data.avg_volume,
        market_cap=quote_data.market_cap,
        shares_outstanding=quote_data.shares_outstanding,
        timestamp=quote_data.timestamp,
        created_at=quote_data.timestamp  # Use timestamp as created_at
    )


@router.get("/brokers/{broker_name}/quotes/{symbol}/historical", response_model=List[HistoricalPriceResponse])
@limiter.limit("20/minute")
async def get_broker_historical_data(
    request: Request,
    broker_name: str,
    symbol: str,
    timeframe: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get historical price data from specific broker."""
    symbol = symbol.upper()

    historical_data = await broker_service.get_historical_from_broker(
        broker_name, symbol, timeframe, limit
    )

    if not historical_data:
        raise HTTPException(
            status_code=404,
            detail=f"No historical data found for {symbol} on broker: {broker_name}"
        )

    # Convert to response format
    return [
        HistoricalPriceResponse(
            id=0,  # Broker data might not have IDs
            symbol=price.symbol,
            exchange=price.exchange,
            open=price.open,
            high=price.high,
            low=price.low,
            close=price.close,
            volume=price.volume,
            adjusted_close=price.adjusted_close,
            timeframe=price.timeframe,
            date=price.date,
            created_at=price.date  # Use date as created_at
        ) for price in historical_data
    ]


@router.get("/brokers", response_model=List[str])
async def get_available_brokers():
    """Get list of available brokers."""
    return await broker_service.get_available_brokers()