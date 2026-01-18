"""Currency conversion API endpoints."""

from fastapi import APIRouter, HTTPException, Query, Request
from datetime import date
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.quote import CurrencyRate
from app.services.currency_converter import currency_converter
import structlog

logger = structlog.get_logger()
router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


@router.get("/currency/rate", response_model=float)
@limiter.limit("50/minute")
async def get_exchange_rate(
    request: Request,
    from_currency: str = Query(..., max_length=3),
    to_currency: str = Query(..., max_length=3),
    date_param: date = Query(None, alias="date")
):
    """Get exchange rate between two currencies."""
    rate = await currency_converter.get_exchange_rate(
        from_currency.upper(),
        to_currency.upper(),
        date_param
    )

    if rate is None:
        raise HTTPException(
            status_code=404,
            detail=f"Exchange rate not found for {from_currency} to {to_currency}"
        )

    return rate


@router.get("/currency/convert", response_model=float)
@limiter.limit("50/minute")
async def convert_currency(
    request: Request,
    amount: float = Query(..., gt=0),
    from_currency: str = Query(..., max_length=3),
    to_currency: str = Query(..., max_length=3),
    date_param: date = Query(None, alias="date")
):
    """Convert an amount between currencies."""
    converted = await currency_converter.convert_amount(
        amount,
        from_currency.upper(),
        to_currency.upper(),
        date_param
    )

    if converted is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversion not possible for {amount} {from_currency} to {to_currency}"
        )

    return converted


@router.get("/currency/trm", response_model=CurrencyRate)
@limiter.limit("30/minute")
async def get_trm_rate(
    request: Request,
    date_param: date = Query(None, alias="date")
):
    """Get TRM (USD/COP) rate from Banco de la República."""
    from app.services.trm import trm_client

    rate = await trm_client.get_trm_rate(date_param)
    if not rate:
        raise HTTPException(
            status_code=404,
            detail="TRM rate not found"
        )

    return rate