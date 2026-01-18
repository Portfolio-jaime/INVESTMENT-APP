"""Redis caching service."""

import json
from typing import Optional, Any
from app.db.redis import get_redis
from app.core.config import settings
import structlog

logger = structlog.get_logger()


class CacheService:
    """Service for caching market data in Redis."""
    
    def __init__(self):
        self.default_ttl = settings.REDIS_CACHE_TTL
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            redis = await get_redis()
            value = await redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL."""
        try:
            redis = await get_redis()
            ttl = ttl or self.default_ttl
            await redis.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True
        except Exception as e:
            logger.error("Cache delete error", key=key, error=str(e))
            return False
    
    async def get_quote(self, symbol: str) -> Optional[dict]:
        """Get cached quote."""
        return await self.get(f"quote:{symbol}")
    
    async def set_quote(self, symbol: str, quote: dict, ttl: int = 60) -> bool:
        """Cache quote data."""
        return await self.set(f"quote:{symbol}", quote, ttl)
    
    async def get_historical(self, symbol: str, timeframe: str) -> Optional[list]:
        """Get cached historical data."""
        return await self.get(f"historical:{symbol}:{timeframe}")
    
    async def set_historical(self, symbol: str, timeframe: str, data: list, ttl: int = 3600) -> bool:
        """Cache historical data."""
        return await self.set(f"historical:{symbol}:{timeframe}", data, ttl)

    async def get_currency_rate(self, from_currency: str, to_currency: str, date_key: Optional[str] = None) -> Optional[float]:
        """Get cached currency rate."""
        key = f"currency:{from_currency}:{to_currency}"
        if date_key:
            key += f":{date_key}"
        cached = await self.get(key)
        return cached if isinstance(cached, (int, float)) else None

    async def set_currency_rate(self, from_currency: str, to_currency: str, rate: float, date_key: Optional[str] = None, ttl: int = 3600) -> bool:
        """Cache currency rate."""
        key = f"currency:{from_currency}:{to_currency}"
        if date_key:
            key += f":{date_key}"
        return await self.set(key, rate, ttl)

    async def get_broker_quote(self, broker: str, symbol: str) -> Optional[dict]:
        """Get cached broker quote."""
        return await self.get(f"broker:quote:{broker}:{symbol}")

    async def set_broker_quote(self, broker: str, symbol: str, quote: dict, ttl: int = 60) -> bool:
        """Cache broker quote."""
        return await self.set(f"broker:quote:{broker}:{symbol}", quote, ttl)


cache_service = CacheService()
