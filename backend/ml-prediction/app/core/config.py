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
    PORTFOLIO_MANAGER_URL: str = "http://portfolio-manager:8005"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8002",
        "http://localhost:8003",
        "http://localhost:8004",
        "http://localhost:8005",
    ]

    # ML Model Settings
    MIN_TRAINING_SAMPLES: int = 30  # Minimum days of data needed
    PREDICTION_WINDOW: int = 1  # Days to predict ahead

    # Technical Indicator Thresholds
    RSI_OVERSOLD: float = 30.0
    RSI_OVERBOUGHT: float = 70.0

    # LLM Configuration
    # OpenAI Settings
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 2000

    # Ollama Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODELS: List[str] = ["llama2:13b", "llama2:7b", "codellama"]

    # Llama.cpp Settings
    LLAMA_CPP_MODEL_PATHS: dict = {}  # Model name -> path mapping
    LLAMA_CPP_N_CTX: int = 2048

    # MCP Configuration
    MCP_CACHE_TTL: int = 300  # Cache TTL in seconds
    MCP_ENABLE_TOOLS: bool = True

    # Security Settings
    ENCRYPTION_KEY: str = ""  # For encrypting sensitive data
    JWT_SECRET_KEY: str = ""  # For API authentication
    DATA_RETENTION_DAYS: int = 90

    # Colombian Market Settings
    TRM_API_URL: str = "https://www.superfinanciera.gov.co/SuperfinancieraWebServiceTRM/TCRMServicesWebService/TCRMService"
    ENABLE_COLOMBIAN_FEATURES: bool = True

    # Portfolio Optimization Settings
    MAX_PORTFOLIO_SIZE: int = 50  # Maximum assets in optimization
    RISK_FREE_RATE: float = 0.03  # Colombian risk-free rate approximation
    OPTIMIZATION_TIMEOUT: int = 30  # Seconds

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
