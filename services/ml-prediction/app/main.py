"""Main FastAPI application for ML Prediction Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from app.api import predictions

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
    description="Machine Learning Prediction Service for TRII Investment Platform",
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
    predictions.router,
    prefix=f"{settings.API_V1_PREFIX}/predictions",
    tags=["ML Predictions"]
)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info(
        "Starting ML Prediction Service",
        version=settings.APP_VERSION,
        market_data_url=settings.MARKET_DATA_SERVICE_URL,
        analysis_engine_url=settings.ANALYSIS_ENGINE_URL
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Shutting down ML Prediction Service")


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
        "description": "ML Prediction Service - Price predictions, trading signals, and trend analysis",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "metrics": "/metrics",
            "api": settings.API_V1_PREFIX
        },
        "predictions": [
            "Price Prediction - Next day closing price forecast",
            "Trading Signals - Buy/Sell/Hold recommendations",
            "Trend Analysis - Up/Down/Neutral trend prediction"
        ],
        "models": {
            "price_prediction": "Linear Regression with Moving Averages",
            "signal_generation": "RSI + MACD Analysis",
            "trend_prediction": "Moving Average Slope Analysis"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
