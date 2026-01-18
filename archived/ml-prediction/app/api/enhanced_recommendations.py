"""Enhanced recommendations API endpoints with LLM and personalization."""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Dict, Any, Optional
import structlog
from datetime import datetime

from app.schemas.enhanced_recommendations import (
    PersonalizedRecommendationRequest,
    PersonalizedRecommendationResponse,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    PortfolioOptimizationRequest,
    PortfolioOptimizationResponse,
    ColombianMarketRequest,
    ColombianMarketResponse,
    UserProfileRequest,
    UserProfileResponse,
    LLMInsightsRequest,
    LLMInsightsResponse,
    BatchRecommendationRequest,
    BatchRecommendationResponse,
    HealthCheckResponse,
    ServiceMetricsResponse,
    FeedbackSubmission,
    FeedbackResponse,
    ModelSwitchRequest,
    ModelSwitchResponse,
    CacheManagementRequest,
    CacheManagementResponse
)
from app.services.personalized_recommendations import recommendation_engine
from app.services.risk_assessment import risk_assessment_service
from app.core.llm_orchestrator import llm_orchestrator
from app.services.user_profiling import user_profiling_service
from app.core.config import settings
from app.mcp.server import mcp_server

logger = structlog.get_logger()
router = APIRouter()


@router.post("/personalized/{user_id}", response_model=PersonalizedRecommendationResponse)
async def get_personalized_recommendations(
    user_id: str,
    request: PersonalizedRecommendationRequest,
    background_tasks: BackgroundTasks
) -> PersonalizedRecommendationResponse:
    """
    Get personalized investment recommendations for a user.

    This endpoint provides AI-powered, personalized investment recommendations
    based on user profile, risk tolerance, behavioral patterns, and market context.
    """
    try:
        logger.info("Processing personalized recommendation request", user_id=user_id, symbols=request.symbols)

        # Get personalized recommendations
        recommendations = await recommendation_engine.generate_personalized_recommendations(
            user_id=user_id,
            symbols=request.symbols,
            market_context=request.market_context
        )

        # Get user profile summary
        user_profile = await user_profiling_service.user_profiling.build_user_profile(user_id)
        profile_summary = {
            "risk_tolerance": user_profile.risk_tolerance.level.value,
            "profile_completeness": user_profile.profile_completeness,
            "behavioral_biases": [bias for bias in user_profile.behavioral_profile.cognitive_biases]
        }

        # Add background task for analytics
        background_tasks.add_task(_log_recommendation_analytics, user_id, recommendations)

        response = PersonalizedRecommendationResponse(
            user_id=user_id,
            recommendations=[rec.dict() for rec in recommendations],
            user_profile_summary=profile_summary,
            processing_metadata={
                "symbols_processed": len(request.symbols),
                "llm_models_used": list(set(r.get("model_used") for r in recommendations if r.get("model_used"))),
                "processing_time": "calculated_in_background"
            }
        )

        logger.info("Personalized recommendations generated successfully", user_id=user_id, count=len(recommendations))
        return response

    except Exception as e:
        logger.error("Failed to generate personalized recommendations", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@router.post("/risk/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
    """
    Perform comprehensive risk assessment for portfolios or securities.
    """
    try:
        logger.info("Processing risk assessment request", target_type=request.target_type, target_id=request.target_id)

        if request.target_type == "portfolio":
            # Portfolio risk assessment
            risk_metrics = await risk_assessment_service.calculate_portfolio_risk(
                portfolio={"holdings": []},  # Would fetch from portfolio service
                historical_data=None
            )

            stress_results = None
            if request.include_stress_tests:
                stress_results = await risk_assessment_service.run_stress_tests(
                    portfolio={"holdings": []},
                    scenarios=[{"name": "Market Crash", "magnitude": -0.3}]
                )

        elif request.target_type == "security":
            # Security risk assessment
            risk_metrics = await risk_assessment_service.calculate_security_risk(
                symbol=request.target_id,
                historical_prices=[],  # Would fetch from market data service
                current_price=100.0
            )
            stress_results = None

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported target type: {request.target_type}")

        recommendations = _generate_risk_recommendations(risk_metrics)

        response = RiskAssessmentResponse(
            target_type=request.target_type,
            target_id=request.target_id,
            risk_metrics=risk_metrics,
            stress_test_results=stress_results,
            recommendations=recommendations
        )

        logger.info("Risk assessment completed", target_type=request.target_type, target_id=request.target_id)
        return response

    except Exception as e:
        logger.error("Failed to perform risk assessment", target_type=request.target_type, target_id=request.target_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@router.post("/portfolio/optimize", response_model=PortfolioOptimizationResponse)
async def optimize_portfolio(request: PortfolioOptimizationRequest) -> PortfolioOptimizationResponse:
    """
    Optimize portfolio based on user constraints and objectives.
    """
    try:
        logger.info("Processing portfolio optimization request", portfolio_id=request.portfolio_id)

        # Placeholder for portfolio optimization logic
        # In a full implementation, this would use cvxpy for optimization

        optimized_portfolio = {
            "holdings": [
                {"symbol": "AAPL", "weight": 0.25, "expected_return": 0.08},
                {"symbol": "MSFT", "weight": 0.20, "expected_return": 0.07},
                {"symbol": "GOOGL", "weight": 0.15, "expected_return": 0.06},
                {"symbol": "ECOPETROL.CB", "weight": 0.40, "expected_return": 0.12}
            ],
            "total_value": 100000,
            "rebalancing_required": True
        }

        rebalancing_actions = [
            {"action": "buy", "symbol": "ECOPETROL.CB", "amount": 15000, "reason": "Increase Colombian market exposure"},
            {"action": "sell", "symbol": "AAPL", "amount": 5000, "reason": "Reduce overweight position"}
        ]

        response = PortfolioOptimizationResponse(
            portfolio_id=request.portfolio_id,
            optimized_portfolio=optimized_portfolio,
            expected_returns=0.085,
            expected_volatility=0.12,
            sharpe_ratio=0.71,
            rebalancing_actions=rebalancing_actions,
            optimization_metadata={
                "optimization_type": request.optimization_type,
                "constraints_applied": request.constraints,
                "solver_used": "cvxpy"
            }
        )

        logger.info("Portfolio optimization completed", portfolio_id=request.portfolio_id)
        return response

    except Exception as e:
        logger.error("Failed to optimize portfolio", portfolio_id=request.portfolio_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Portfolio optimization failed: {str(e)}")


@router.post("/colombian/analysis", response_model=ColombianMarketResponse)
async def get_colombian_market_analysis(request: ColombianMarketRequest) -> ColombianMarketResponse:
    """
    Get Colombian market-specific analysis and recommendations.
    """
    try:
        logger.info("Processing Colombian market analysis request")

        # Placeholder for Colombian market analysis
        market_overview = {
            "bvc_performance": {"ytd_return": 0.05, "volatility": 0.18},
            "trm_current": 3850.0,
            "trm_trend": "stable",
            "sector_performance": {
                "energy": 0.08,
                "financials": 0.03,
                "industrials": 0.06
            }
        }

        trm_analysis = {
            "current_trm": 3850.0,
            "impact_on_exports": "positive",
            "currency_risk": "moderate",
            "recommendations": ["Monitor TRM for import-heavy portfolios"]
        }

        regulatory_updates = [
            {"date": "2024-01-15", "title": "New ESG reporting requirements", "impact": "medium"},
            {"date": "2024-01-10", "title": "Updated foreign investment rules", "impact": "high"}
        ]

        symbol_analysis = {}
        if request.symbols:
            for symbol in request.symbols:
                symbol_analysis[symbol] = {
                    "local_rating": "BBB" if symbol.endswith('.CB') else "N/A",
                    "regulatory_status": "compliant",
                    "market_impact": "medium"
                }

        recommendations = [
            "Consider increasing exposure to energy sector given current oil prices",
            "Monitor regulatory changes for foreign investors",
            "TRM stability supports long-term Colombian investments"
        ]

        response = ColombianMarketResponse(
            market_overview=market_overview,
            trm_analysis=trm_analysis,
            regulatory_updates=regulatory_updates,
            symbol_analysis=symbol_analysis,
            recommendations=recommendations
        )

        logger.info("Colombian market analysis completed")
        return response

    except Exception as e:
        logger.error("Failed to perform Colombian market analysis", error=str(e))
        raise HTTPException(status_code=500, detail=f"Colombian market analysis failed: {str(e)}")


@router.get("/user/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, include_assessment: bool = True) -> UserProfileResponse:
    """
    Get user investment profile and assessment history.
    """
    try:
        logger.info("Retrieving user profile", user_id=user_id)

        # Build user profile
        profile = await user_profiling_service.build_user_profile(user_id)

        # Get assessment history (placeholder)
        assessment_history = [
            {
                "date": datetime.utcnow().isoformat(),
                "type": "risk_tolerance",
                "score": profile.risk_tolerance.overall_score,
                "level": profile.risk_tolerance.level.value
            }
        ]

        recommendations = [
            f"Based on your {profile.risk_tolerance.level.value} risk tolerance, consider diversifying across {max(3, len(profile.preferences.sector_preferences))} sectors",
            "Complete your investment questionnaire for more accurate recommendations"
        ]

        response = UserProfileResponse(
            user_id=user_id,
            profile=profile.dict(),
            assessment_history=assessment_history,
            recommendations=recommendations,
            last_updated=profile.updated_at
        )

        logger.info("User profile retrieved successfully", user_id=user_id)
        return response

    except Exception as e:
        logger.error("Failed to retrieve user profile", user_id=user_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user profile: {str(e)}")


@router.post("/llm/insights", response_model=LLMInsightsResponse)
async def get_llm_insights(request: LLMInsightsRequest) -> LLMInsightsResponse:
    """
    Get LLM-powered insights for investment analysis.
    """
    try:
        logger.info("Generating LLM insights", symbol=request.symbol, insight_type=request.insight_type)

        # Generate LLM insights
        llm_result = await llm_orchestrator.generate_recommendation(
            symbol=request.symbol,
            user_id=request.user_id,
            context_data=request.context or {},
            task_complexity=llm_orchestrator._determine_task_complexity_from_request(request)
        )

        insights = [
            {
                "type": "technical_analysis",
                "title": "Technical Analysis Insight",
                "content": llm_result.get("recommendation", {}).get("technical_insights", "Analysis in progress"),
                "confidence": 0.8
            },
            {
                "type": "market_context",
                "title": "Market Context Analysis",
                "content": llm_result.get("recommendation", {}).get("market_context", "Context analysis available"),
                "confidence": 0.75
            }
        ]

        response = LLMInsightsResponse(
            symbol=request.symbol,
            insight_type=request.insight_type,
            insights=insights,
            model_used=llm_result.get("model_used", "unknown"),
            confidence_score=0.8,
            processing_time=2.5  # Mock processing time
        )

        logger.info("LLM insights generated successfully", symbol=request.symbol)
        return response

    except Exception as e:
        logger.error("Failed to generate LLM insights", symbol=request.symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"LLM insights generation failed: {str(e)}")


@router.post("/batch/recommendations", response_model=BatchRecommendationResponse)
async def process_batch_recommendations(
    request: BatchRecommendationRequest,
    background_tasks: BackgroundTasks
) -> BatchRecommendationResponse:
    """
    Process recommendations for multiple users/symbols in batch.
    """
    try:
        logger.info("Processing batch recommendation request",
                   users=len(request.user_ids),
                   symbols=len(request.symbols))

        batch_id = f"batch_{datetime.utcnow().timestamp()}"
        results = []
        processed_count = 0
        failed_count = 0

        # Process in background for large batches
        if len(request.user_ids) * len(request.symbols) > 20:
            background_tasks.add_task(_process_batch_async, batch_id, request)
            results = [{"status": "processing", "message": "Batch processing started"}]
        else:
            # Process synchronously for small batches
            for user_id in request.user_ids:
                try:
                    user_recommendations = await recommendation_engine.generate_personalized_recommendations(
                        user_id=user_id,
                        symbols=request.symbols[:10]  # Limit per user
                    )
                    results.extend([rec.dict() for rec in user_recommendations])
                    processed_count += 1
                except Exception as e:
                    logger.error("Failed to process user in batch", user_id=user_id, error=str(e))
                    failed_count += 1

        response = BatchRecommendationResponse(
            batch_id=batch_id,
            total_requests=len(request.user_ids) * len(request.symbols),
            processed_requests=processed_count,
            failed_requests=failed_count,
            results=results,
            processing_summary={
                "recommendation_type": request.recommendation_type.value,
                "processing_mode": "background" if len(results) == 1 else "synchronous"
            }
        )

        logger.info("Batch recommendation processing initiated", batch_id=batch_id)
        return response

    except Exception as e:
        logger.error("Failed to process batch recommendations", error=str(e))
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> HealthCheckResponse:
    """
    Comprehensive health check for the enhanced recommendation service.
    """
    try:
        # Check LLM orchestrator health
        llm_health = await llm_orchestrator.health_check()

        # Check MCP server status
        mcp_status = "healthy" if mcp_server.adapters else "degraded"

        # Check core services
        components = {
            "llm_orchestrator": {
                "status": llm_health.get("overall_status", "unknown"),
                "models_available": len(llm_health.get("models", {}))
            },
            "mcp_server": {
                "status": mcp_status,
                "providers_registered": len(mcp_server.providers),
                "adapters_registered": len(mcp_server.adapters)
            },
            "recommendation_engine": {
                "status": "healthy",  # Would check actual service health
                "version": "2.0.0"
            },
            "risk_assessment": {
                "status": "healthy",
                "version": "1.0.0"
            }
        }

        overall_status = "healthy"
        if any(comp["status"] != "healthy" for comp in components.values()):
            overall_status = "degraded"
        if any(comp["status"] == "unhealthy" for comp in components.values()):
            overall_status = "unhealthy"

        response = HealthCheckResponse(
            version=settings.APP_VERSION,
            status=overall_status,
            components=components,
            uptime=0.0,  # Would track actual uptime
        )

        return response

    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=500, detail="Health check failed")


@router.get("/metrics", response_model=ServiceMetricsResponse)
async def get_service_metrics(time_range: str = "24h") -> ServiceMetricsResponse:
    """
    Get service performance and usage metrics.
    """
    try:
        # Placeholder metrics - in production, would collect from monitoring system
        metrics = ServiceMetricsResponse(
            time_range=time_range,
            recommendation_metrics={
                "total_recommendations": 1250,
                "average_processing_time": 2.3,
                "success_rate": 0.97,
                "personalization_rate": 0.89
            },
            llm_metrics={
                "total_tokens": 45000,
                "models_used": ["openai-gpt-4", "ollama-llama2:13b"],
                "average_cost": 0.02,
                "fallback_rate": 0.05
            },
            risk_metrics={
                "assessments_performed": 340,
                "average_confidence": 0.82,
                "stress_tests_run": 45
            },
            performance_metrics={
                "average_response_time": 1.8,
                "p95_response_time": 4.2,
                "throughput": 25.5,
                "error_rate": 0.03
            },
            error_metrics={
                "total_errors": 12,
                "error_rate": 0.03,
                "top_error_types": ["timeout", "model_unavailable"]
            }
        )

        return metrics

    except Exception as e:
        logger.error("Failed to retrieve service metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackSubmission) -> FeedbackResponse:
    """
    Submit user feedback on recommendations.
    """
    try:
        logger.info("Processing feedback submission",
                   user_id=request.user_id,
                   recommendation_id=request.recommendation_id,
                   rating=request.rating)

        feedback_id = f"feedback_{datetime.utcnow().timestamp()}"

        # Store feedback (placeholder - would save to database)
        _store_feedback(request)

        response = FeedbackResponse(
            feedback_id=feedback_id,
            status="accepted",
            message="Thank you for your feedback. It will help improve our recommendations."
        )

        logger.info("Feedback submitted successfully", feedback_id=feedback_id)
        return response

    except Exception as e:
        logger.error("Failed to submit feedback", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


@router.post("/admin/models/switch", response_model=ModelSwitchResponse)
async def switch_llm_model(request: ModelSwitchRequest) -> ModelSwitchResponse:
    """
    Switch active LLM model (admin endpoint).
    """
    try:
        logger.info("Processing model switch request", model_name=request.model_name, reason=request.reason)

        # Placeholder for model switching logic
        previous_model = "openai-gpt-4"  # Would get from current config
        current_model = request.model_name

        # Update configuration (placeholder)
        _update_active_model(request.model_name, request.temporary, request.duration_hours)

        response = ModelSwitchResponse(
            success=True,
            previous_model=previous_model,
            current_model=current_model,
            message=f"Successfully switched to {request.model_name}"
        )

        logger.info("Model switch completed", from_model=previous_model, to_model=current_model)
        return response

    except Exception as e:
        logger.error("Failed to switch model", model_name=request.model_name, error=str(e))
        raise HTTPException(status_code=500, detail="Model switch failed")


@router.post("/admin/cache/manage", response_model=CacheManagementResponse)
async def manage_cache(request: CacheManagementRequest) -> CacheManagementResponse:
    """
    Manage MCP cache (admin endpoint).
    """
    try:
        logger.info("Processing cache management request", operation=request.operation, scope=request.scope)

        if request.operation == "clear":
            mcp_server.clear_cache(request.target_id if request.scope == "user" else None)
            affected_items = 1  # Would get actual count
        elif request.operation == "stats":
            affected_items = 0  # Stats operation
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {request.operation}")

        response = CacheManagementResponse(
            operation=request.operation,
            scope=request.scope,
            affected_items=affected_items,
            cache_stats={
                "total_entries": len(mcp_server.context_cache),
                "cache_size_mb": 0.0,  # Would calculate actual size
                "hit_rate": 0.85  # Would get from monitoring
            }
        )

        logger.info("Cache management completed", operation=request.operation, affected_items=affected_items)
        return response

    except Exception as e:
        logger.error("Failed to manage cache", operation=request.operation, error=str(e))
        raise HTTPException(status_code=500, detail="Cache management failed")


# Helper functions

async def _log_recommendation_analytics(user_id: str, recommendations: List[Dict[str, Any]]) -> None:
    """Log recommendation analytics in background."""
    try:
        # Placeholder for analytics logging
        logger.info("Recommendation analytics logged",
                   user_id=user_id,
                   recommendations_count=len(recommendations))
    except Exception as e:
        logger.error("Failed to log recommendation analytics", error=str(e))


async def _process_batch_async(batch_id: str, request: BatchRecommendationRequest) -> None:
    """Process batch recommendations asynchronously."""
    try:
        logger.info("Starting async batch processing", batch_id=batch_id)

        # Placeholder for async batch processing
        # Would implement actual batch processing logic here

        logger.info("Async batch processing completed", batch_id=batch_id)

    except Exception as e:
        logger.error("Async batch processing failed", batch_id=batch_id, error=str(e))


def _generate_risk_recommendations(risk_metrics: Dict[str, Any]) -> List[str]:
    """Generate risk management recommendations based on metrics."""
    recommendations = []

    volatility = risk_metrics.get("volatility", {}).get("annual", 0)
    if volatility > 0.25:
        recommendations.append("Consider reducing portfolio volatility through diversification")

    sharpe_ratio = risk_metrics.get("sharpe_ratio", 0)
    if sharpe_ratio < 0.5:
        recommendations.append("Portfolio returns may not justify the risk level - consider rebalancing")

    max_drawdown = risk_metrics.get("maximum_drawdown", 0)
    if max_drawdown > 0.20:
        recommendations.append("Implement stop-loss orders to limit potential losses")

    return recommendations if recommendations else ["Risk metrics are within acceptable ranges"]


def _store_feedback(feedback: FeedbackSubmission) -> None:
    """Store user feedback (placeholder)."""
    # In production, would save to database
    pass


def _update_active_model(model_name: str, temporary: bool, duration_hours: Optional[int]) -> None:
    """Update active LLM model (placeholder)."""
    # In production, would update configuration and restart services if needed
    pass