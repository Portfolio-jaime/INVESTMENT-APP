"""Enhanced API schemas for the comprehensive recommendation service."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class RecommendationType(str, Enum):
    """Types of recommendations."""
    PERSONALIZED = "personalized"
    RISK_BASED = "risk_based"
    PORTFOLIO_OPTIMIZATION = "portfolio_optimization"
    COLOMBIAN_MARKET = "colombian_market"


class PersonalizedRecommendationRequest(BaseModel):
    """Request for personalized recommendations."""
    user_id: str = Field(..., description="User identifier")
    symbols: List[str] = Field(..., description="List of symbols to analyze", min_items=1, max_items=20)
    include_risk_analysis: bool = Field(default=True, description="Include risk analysis")
    include_portfolio_context: bool = Field(default=True, description="Include portfolio context")
    market_context: Optional[Dict[str, Any]] = Field(None, description="Additional market context")


class PersonalizedRecommendationResponse(BaseModel):
    """Response with personalized recommendations."""
    user_id: str = Field(..., description="User identifier")
    recommendations: List[Dict[str, Any]] = Field(..., description="List of personalized recommendations")
    user_profile_summary: Dict[str, Any] = Field(..., description="Summary of user profile used")
    processing_metadata: Dict[str, Any] = Field(..., description="Processing metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class RiskAssessmentRequest(BaseModel):
    """Request for risk assessment."""
    target_type: str = Field(..., description="Type of risk assessment (portfolio, security, user)")
    target_id: str = Field(..., description="Identifier for the target (portfolio_id, symbol, user_id)")
    assessment_type: str = Field(default="comprehensive", description="Type of assessment")
    include_stress_tests: bool = Field(default=False, description="Include stress testing")
    scenarios: Optional[List[str]] = Field(None, description="Specific stress test scenarios")


class RiskAssessmentResponse(BaseModel):
    """Response with risk assessment results."""
    target_type: str = Field(..., description="Type assessed")
    target_id: str = Field(..., description="Target identifier")
    risk_metrics: Dict[str, Any] = Field(..., description="Risk metrics")
    stress_test_results: Optional[Dict[str, Any]] = Field(None, description="Stress test results")
    recommendations: List[str] = Field(..., description="Risk management recommendations")
    assessment_date: datetime = Field(default_factory=datetime.utcnow, description="Assessment timestamp")


class PortfolioOptimizationRequest(BaseModel):
    """Request for portfolio optimization."""
    portfolio_id: str = Field(..., description="Portfolio identifier")
    optimization_type: str = Field(default="modern_portfolio_theory", description="Optimization approach")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Optimization constraints")
    risk_tolerance: Optional[str] = Field(None, description="Risk tolerance level")
    tax_considerations: bool = Field(default=False, description="Include tax optimization")


class PortfolioOptimizationResponse(BaseModel):
    """Response with portfolio optimization results."""
    portfolio_id: str = Field(..., description="Portfolio identifier")
    optimized_portfolio: Dict[str, Any] = Field(..., description="Optimized portfolio composition")
    expected_returns: float = Field(..., description="Expected annual returns")
    expected_volatility: float = Field(..., description="Expected annual volatility")
    sharpe_ratio: float = Field(..., description="Optimized Sharpe ratio")
    rebalancing_actions: List[Dict[str, Any]] = Field(..., description="Required rebalancing actions")
    optimization_metadata: Dict[str, Any] = Field(..., description="Optimization metadata")


class ColombianMarketRequest(BaseModel):
    """Request for Colombian market analysis."""
    symbols: Optional[List[str]] = Field(None, description="Specific Colombian symbols to analyze")
    include_trm_analysis: bool = Field(default=True, description="Include TRM impact analysis")
    include_regulatory_info: bool = Field(default=True, description="Include regulatory information")
    market_context: Optional[Dict[str, Any]] = Field(None, description="Colombian market context")


class ColombianMarketResponse(BaseModel):
    """Response with Colombian market analysis."""
    market_overview: Dict[str, Any] = Field(..., description="Colombian market overview")
    trm_analysis: Dict[str, Any] = Field(..., description="TRM impact analysis")
    regulatory_updates: List[Dict[str, Any]] = Field(..., description="Regulatory information")
    symbol_analysis: Dict[str, Any] = Field(..., description="Analysis of requested symbols")
    recommendations: List[str] = Field(..., description="Colombian market recommendations")


class UserProfileRequest(BaseModel):
    """Request to get or update user profile."""
    user_id: str = Field(..., description="User identifier")
    include_assessment: bool = Field(default=True, description="Include latest risk assessment")
    update_data: Optional[Dict[str, Any]] = Field(None, description="Data to update profile with")


class UserProfileResponse(BaseModel):
    """Response with user profile information."""
    user_id: str = Field(..., description="User identifier")
    profile: Dict[str, Any] = Field(..., description="Complete user profile")
    assessment_history: List[Dict[str, Any]] = Field(..., description="Assessment history")
    recommendations: List[str] = Field(..., description="Profile-based recommendations")
    last_updated: datetime = Field(..., description="Last profile update")


class LLMInsightsRequest(BaseModel):
    """Request for LLM-powered insights."""
    symbol: str = Field(..., description="Symbol to analyze")
    insight_type: str = Field(default="comprehensive", description="Type of insight requested")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    user_id: Optional[str] = Field(None, description="User for personalization")


class LLMInsightsResponse(BaseModel):
    """Response with LLM-powered insights."""
    symbol: str = Field(..., description="Analyzed symbol")
    insight_type: str = Field(..., description="Type of insight provided")
    insights: List[Dict[str, Any]] = Field(..., description="Generated insights")
    model_used: str = Field(..., description="LLM model used")
    confidence_score: float = Field(..., description="Confidence in insights")
    processing_time: float = Field(..., description="Processing time in seconds")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Generation timestamp")


class BatchRecommendationRequest(BaseModel):
    """Request for batch processing of recommendations."""
    user_ids: List[str] = Field(..., description="List of user IDs", min_items=1, max_items=10)
    symbols: List[str] = Field(..., description="List of symbols to analyze", min_items=1, max_items=50)
    recommendation_type: RecommendationType = Field(default=RecommendationType.PERSONALIZED, description="Type of recommendations")
    priority_users: Optional[List[str]] = Field(None, description="High-priority users")
    processing_options: Dict[str, Any] = Field(default_factory=dict, description="Processing options")


class BatchRecommendationResponse(BaseModel):
    """Response for batch recommendation processing."""
    batch_id: str = Field(..., description="Unique batch identifier")
    total_requests: int = Field(..., description="Total number of requests")
    processed_requests: int = Field(..., description="Successfully processed requests")
    failed_requests: int = Field(..., description="Failed requests")
    results: List[Dict[str, Any]] = Field(..., description="Batch results")
    processing_summary: Dict[str, Any] = Field(..., description="Processing summary")
    started_at: datetime = Field(..., description="Batch processing start time")
    completed_at: datetime = Field(default_factory=datetime.utcnow, description="Batch completion time")


class HealthCheckResponse(BaseModel):
    """Health check response for the service."""
    service_name: str = Field(default="Enhanced Recommendation Service", description="Service name")
    version: str = Field(..., description="Service version")
    status: str = Field(..., description="Overall service status")
    components: Dict[str, Dict[str, Any]] = Field(..., description="Component health status")
    uptime: float = Field(..., description="Service uptime in seconds")
    last_health_check: datetime = Field(default_factory=datetime.utcnow, description="Last health check time")


class ServiceMetricsResponse(BaseModel):
    """Response with service performance metrics."""
    time_range: str = Field(..., description="Time range for metrics")
    recommendation_metrics: Dict[str, Any] = Field(..., description="Recommendation processing metrics")
    llm_metrics: Dict[str, Any] = Field(..., description="LLM usage metrics")
    risk_metrics: Dict[str, Any] = Field(..., description="Risk assessment metrics")
    performance_metrics: Dict[str, Any] = Field(..., description="Performance metrics")
    error_metrics: Dict[str, Any] = Field(..., description="Error metrics")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Metrics generation time")


class FeedbackSubmission(BaseModel):
    """User feedback submission."""
    user_id: str = Field(..., description="User providing feedback")
    recommendation_id: str = Field(..., description="Recommendation identifier")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5)")
    feedback_text: Optional[str] = Field(None, description="Optional feedback text")
    feedback_type: str = Field(default="general", description="Type of feedback")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class FeedbackResponse(BaseModel):
    """Response to feedback submission."""
    feedback_id: str = Field(..., description="Unique feedback identifier")
    status: str = Field(..., description="Feedback processing status")
    message: str = Field(..., description="Response message")
    submitted_at: datetime = Field(default_factory=datetime.utcnow, description="Submission timestamp")


class ModelSwitchRequest(BaseModel):
    """Request to switch LLM models."""
    model_name: str = Field(..., description="Target model name")
    reason: str = Field(..., description="Reason for switching")
    temporary: bool = Field(default=True, description="Whether this is a temporary switch")
    duration_hours: Optional[int] = Field(None, description="Duration for temporary switch")


class ModelSwitchResponse(BaseModel):
    """Response to model switch request."""
    success: bool = Field(..., description="Whether switch was successful")
    previous_model: str = Field(..., description="Previously active model")
    current_model: str = Field(..., description="Currently active model")
    message: str = Field(..., description="Status message")
    switched_at: datetime = Field(default_factory=datetime.utcnow, description="Switch timestamp")


class CacheManagementRequest(BaseModel):
    """Request for cache management operations."""
    operation: str = Field(..., description="Cache operation (clear, stats, warmup)")
    scope: str = Field(default="all", description="Scope of operation (all, user, symbol)")
    target_id: Optional[str] = Field(None, description="Target identifier for scoped operations")


class CacheManagementResponse(BaseModel):
    """Response to cache management operations."""
    operation: str = Field(..., description="Executed operation")
    scope: str = Field(..., description="Operation scope")
    affected_items: int = Field(..., description="Number of affected cache items")
    cache_stats: Dict[str, Any] = Field(..., description="Cache statistics")
    executed_at: datetime = Field(default_factory=datetime.utcnow, description="Execution timestamp")