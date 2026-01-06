"""Configuration settings for ML Prediction Service."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # App Info
    APP_NAME: str = "ML Prediction Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8004

    # Service URLs
    MARKET_DATA_SERVICE_URL: str = "http://market-data:8001"
    ANALYSIS_ENGINE_URL: str = "http://analysis-engine:8002"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8002",
        "http://localhost:8003",
        "http://localhost:8004",
    ]

    # ML Model Settings
    MIN_TRAINING_SAMPLES: int = 30  # Minimum days of data needed
    PREDICTION_WINDOW: int = 1  # Days to predict ahead

    # Technical Indicator Thresholds
    RSI_OVERSOLD: float = 30.0
    RSI_OVERBOUGHT: float = 70.0

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
