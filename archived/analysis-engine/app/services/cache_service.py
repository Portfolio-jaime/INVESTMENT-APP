"""Caching service for analysis results."""

import redis
import json
from typing import Any, Optional
import structlog
from datetime import datetime, timedelta

from app.core.config import settings

logger = structlog.get_logger()


class CacheService:
    """Service for caching analysis results."""

    def __init__(self):
        """Initialize the cache service."""
        self.enabled = settings.CACHE_ENABLED
        self.redis_client = None

        if self.enabled:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL)
                self.redis_client.ping()  # Test connection
                logger.info("Redis cache connected")
            except Exception as e:
                logger.warning("Redis cache unavailable, using in-memory cache", error=str(e))
                self.redis_client = None
                self._memory_cache = {}

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.enabled:
            return None

        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                # In-memory cache
                if key in self._memory_cache:
                    entry = self._memory_cache[key]
                    if datetime.utcnow() < entry['expires']:
                        return entry['value']
                    else:
                        del self._memory_cache[key]
        except Exception as e:
            logger.warning("Cache get error", key=key, error=str(e))

        return None

    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
        """Set value in cache."""
        if not self.enabled:
            return False

        if ttl_seconds is None:
            ttl_seconds = settings.CACHE_TTL

        try:
            serialized_value = json.dumps(value)

            if self.redis_client:
                return bool(self.redis_client.setex(key, ttl_seconds, serialized_value))
            else:
                # In-memory cache
                expires = datetime.utcnow() + timedelta(seconds=ttl_seconds)
                self._memory_cache[key] = {
                    'value': value,
                    'expires': expires
                }
                return True
        except Exception as e:
            logger.warning("Cache set error", key=key, error=str(e))
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if not self.enabled:
            return False

        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                if key in self._memory_cache:
                    del self._memory_cache[key]
                    return True
        except Exception as e:
            logger.warning("Cache delete error", key=key, error=str(e))

        return False

    def generate_key(self, prefix: str, symbol: str, **kwargs) -> str:
        """Generate cache key."""
        key_parts = [prefix, symbol.upper()]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")
        return ":".join(key_parts)


# Singleton instance
cache_service = CacheService()