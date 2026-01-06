"""Main FastAPI application for Analysis Engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from app.api import indicators, fundamentals, sentiment, colombian_market, llm_insights, comprehensive, realtime

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Technical analysis and indicator calculation service for TRII Investment Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    indicators.router,
    prefix=f"{settings.API_V1_PREFIX}/indicators",
    tags=["Technical Indicators"]
)

app.include_router(
    fundamentals.router,
    prefix=f"{settings.API_V1_PREFIX}/fundamentals",
    tags=["Fundamental Analysis"]
)

app.include_router(
    sentiment.router,
    prefix=f"{settings.API_V1_PREFIX}/sentiment",
    tags=["Sentiment Analysis"]
)

app.include_router(
    colombian_market.router,
    prefix=f"{settings.API_V1_PREFIX}/colombian-market",
    tags=["Colombian Market Analysis"]
)

app.include_router(
    llm_insights.router,
    prefix=f"{settings.API_V1_PREFIX}/llm-insights",
    tags=["LLM Insights"]
)

app.include_router(
    comprehensive.router,
    prefix=f"{settings.API_V1_PREFIX}/comprehensive",
    tags=["Comprehensive Analysis"]
)

app.include_router(
    realtime.router,
    prefix=f"{settings.API_V1_PREFIX}/realtime",
    tags=["Real-time Analysis"]
)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info(
        "Starting Analysis Engine Service",
        version=settings.APP_VERSION,
        market_data_url=settings.MARKET_DATA_SERVICE_URL
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Shutting down Analysis Engine Service")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns service status and version information.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/")
async def root():
    """
    Root endpoint.

    Returns basic service information and available endpoints.
    """
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Technical Analysis Engine - Calculate technical indicators for financial markets",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "metrics": "/metrics",
            "api": settings.API_V1_PREFIX
        },
        "indicators": [
            "SMA - Simple Moving Average",
            "EMA - Exponential Moving Average",
            "RSI - Relative Strength Index",
            "MACD - Moving Average Convergence Divergence",
            "Bollinger Bands"
        ],
        "analysis_types": [
            "Technical Indicators",
            "Fundamental Analysis",
            "Sentiment Analysis",
            "Colombian Market Analysis",
            "LLM Insights",
            "Comprehensive Analysis"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.DEBUG
    )
