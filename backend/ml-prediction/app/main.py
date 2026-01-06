"""Main FastAPI application for ML Prediction Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
import structlog

from app.core.config import settings
from app.api import predictions, recommendations, enhanced_recommendations
from app.mcp.providers import MarketDataProvider, UserProfileProvider
from app.mcp.adapters import OpenAIAdapter, OllamaAdapter, LlamaCppAdapter
from app.core.llm_orchestrator import llm_orchestrator
from app.mcp.server import mcp_server

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

app.include_router(
    recommendations.router,
    prefix=f"{settings.API_V1_PREFIX}/recommendations",
    tags=["Investment Recommendations"]
)

app.include_router(
    enhanced_recommendations.router,
    prefix=f"{settings.API_V1_PREFIX}/enhanced",
    tags=["Enhanced Recommendations"]
)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info(
        "Starting Enhanced Recommendation Service",
        version=settings.APP_VERSION,
        market_data_url=settings.MARKET_DATA_SERVICE_URL,
        analysis_engine_url=settings.ANALYSIS_ENGINE_URL
    )

    # Initialize MCP system
    await initialize_mcp_system()

    # Initialize LLM orchestrator
    await initialize_llm_orchestrator()

    logger.info("Enhanced Recommendation Service startup completed")


async def initialize_mcp_system():
    """Initialize MCP (Model Context Protocol) system."""
    try:
        logger.info("Initializing MCP system")

        # Register MCP providers
        # Note: In production, these would be proper service clients
        market_data_provider = MarketDataProvider(market_data_client=None)  # Would inject actual client
        user_profile_provider = UserProfileProvider(user_service=None)  # Would inject actual service

        mcp_server.register_provider(market_data_provider)
        mcp_server.register_provider(user_profile_provider)

        logger.info("MCP providers registered", count=len(mcp_server.providers))

    except Exception as e:
        logger.error("Failed to initialize MCP system", error=str(e))
        raise


async def initialize_llm_orchestrator():
    """Initialize LLM orchestrator with configured models."""
    try:
        logger.info("Initializing LLM orchestrator")

        # Register OpenAI if configured
        if settings.OPENAI_API_KEY:
            llm_orchestrator.register_openai_adapter(
                api_key=settings.OPENAI_API_KEY,
                model=settings.LLM_MODEL
            )
            logger.info("OpenAI adapter registered")

        # Register Ollama if configured
        if settings.OLLAMA_BASE_URL:
            llm_orchestrator.register_ollama_adapter(
                base_url=settings.OLLAMA_BASE_URL
            )
            logger.info("Ollama adapters registered")

        # Register Llama.cpp if configured
        if settings.LLAMA_CPP_MODEL_PATHS:
            llm_orchestrator.register_llama_cpp_adapter(
                model_paths=settings.LLAMA_CPP_MODEL_PATHS
            )
            logger.info("Llama.cpp adapters registered")

        # Check available models
        available_models = await llm_orchestrator.get_available_models()
        available_count = sum(1 for model in available_models if model.get("available", False))

        logger.info("LLM orchestrator initialized",
                   total_models=len(available_models),
                   available_models=available_count)

        if available_count == 0:
            logger.warning("No LLM models available - service will operate in limited mode")

    except Exception as e:
        logger.error("Failed to initialize LLM orchestrator", error=str(e))
        raise


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
        "service": "Enhanced Recommendation Service",
        "version": settings.APP_VERSION,
        "description": "Comprehensive investment recommendation service with LLM-powered analysis, personalization, and risk management",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "metrics": "/metrics",
            "api": settings.API_V1_PREFIX,
            "enhanced_api": f"{settings.API_V1_PREFIX}/enhanced"
        },
        "capabilities": {
            "personalized_recommendations": "AI-powered recommendations based on user profile and risk tolerance",
            "risk_assessment": "Comprehensive portfolio and security risk analysis with stress testing",
            "portfolio_optimization": "Advanced portfolio optimization with tax considerations",
            "colombian_market": "Local market analysis with TRM impact and regulatory compliance",
            "llm_insights": "Multi-model LLM analysis (OpenAI, Ollama, Llama.cpp)",
            "user_profiling": "Dynamic user profiling with behavioral analysis",
            "batch_processing": "High-throughput batch recommendation processing"
        },
        "models": {
            "llm_orchestrator": "Hybrid LLM system with intelligent model selection",
            "mcp_server": "Model Context Protocol for enhanced context management",
            "risk_engine": "Advanced risk metrics with stress testing",
            "personalization_engine": "User-centric recommendation engine",
            "portfolio_optimizer": "Modern portfolio theory with constraints"
        },
        "features": [
            "Multi-factor scoring with behavioral adjustments",
            "Real-time risk monitoring and alerts",
            "Colombian market regulatory compliance",
            "Tax-aware portfolio optimization",
            "LLM-powered market insights",
            "Personalized investment narratives",
            "Batch processing for institutional clients"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
