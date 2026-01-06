"""Application configuration settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Application Info
    APP_NAME: str = "TRII Analysis Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API Settings
    API_V1_PREFIX: str = "/api/v1"

    # Service URLs
    MARKET_DATA_SERVICE_URL: str = "http://market-data:8001"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8002"
    ]

    # Cache Settings
    CACHE_TTL: int = 300  # 5 minutes

    # Technical Indicator Defaults
    DEFAULT_SMA_PERIOD: int = 20
    DEFAULT_EMA_PERIOD: int = 20
    DEFAULT_RSI_PERIOD: int = 14
    DEFAULT_BOLLINGER_PERIOD: int = 20
    DEFAULT_BOLLINGER_STD: float = 2.0

    # MACD Default Parameters
    MACD_FAST_PERIOD: int = 12
    MACD_SLOW_PERIOD: int = 26
    MACD_SIGNAL_PERIOD: int = 9

    # LLM Settings
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 1000

    # Sentiment Analysis
    SENTIMENT_MODEL: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    NEWS_API_KEY: str = ""
    SENTIMENT_CACHE_TTL: int = 3600  # 1 hour

    # Fundamental Analysis
    ALPHA_VANTAGE_API_KEY: str = ""
    FUNDAMENTAL_CACHE_TTL: int = 86400  # 24 hours

    # Colombian Market
    TRM_API_URL: str = "https://www.datos.gov.co/resource/ceyp-9c7c.json"
    BVC_API_URL: str = "https://www.bvc.com.co"
    COLOMBIAN_CACHE_TTL: int = 1800  # 30 minutes

    # Real-time Settings
    WEBSOCKET_MAX_CONNECTIONS: int = 100
    REAL_TIME_UPDATE_INTERVAL: int = 60  # seconds

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_ENABLED: bool = True

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
