"""Pydantic schemas for user profiling and personalization."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class RiskToleranceLevel(str, Enum):
    """Risk tolerance levels."""
    CONSERVATIVE = "conservative"
    MODERATE_CONSERVATIVE = "moderate_conservative"
    MODERATE = "moderate"
    MODERATE_AGGRESSIVE = "moderate_aggressive"
    AGGRESSIVE = "aggressive"


class InvestmentGoal(str, Enum):
    """Primary investment goals."""
    CAPITAL_PRESERVATION = "capital_preservation"
    INCOME_GENERATION = "income_generation"
    GROWTH = "growth"
    SPECULATION = "speculation"
    RETIREMENT = "retirement"


class InvestmentHorizon(str, Enum):
    """Investment time horizons."""
    SHORT_TERM = "short_term"  # < 1 year
    MEDIUM_TERM = "medium_term"  # 1-5 years
    LONG_TERM = "long_term"  # 5-10 years
    VERY_LONG_TERM = "very_long_term"  # > 10 years


class SectorPreference(str, Enum):
    """Sector preferences."""
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCIALS = "financials"
    CONSUMER_DISCRETIONARY = "consumer_discretionary"
    CONSUMER_STAPLES = "consumer_staples"
    ENERGY = "energy"
    INDUSTRIALS = "industrials"
    MATERIALS = "materials"
    UTILITIES = "utilities"
    REAL_ESTATE = "real_estate"


class GeographicPreference(str, Enum):
    """Geographic preferences."""
    DOMESTIC = "domestic"  # Colombian market
    LATAM = "latam"  # Latin America
    EMERGING_MARKETS = "emerging_markets"
    DEVELOPED_MARKETS = "developed_markets"
    GLOBAL = "global"


class RiskToleranceAssessment(BaseModel):
    """Risk tolerance assessment results."""
    overall_score: float = Field(..., ge=0, le=100, description="Overall risk tolerance score (0-100)")
    level: RiskToleranceLevel = Field(..., description="Categorized risk tolerance level")
    questionnaire_score: Optional[float] = Field(None, ge=0, le=100, description="Score from risk questionnaire")
    behavioral_score: Optional[float] = Field(None, ge=0, le=100, description="Score from behavioral analysis")
    portfolio_based_score: Optional[float] = Field(None, ge=0, le=100, description="Score based on portfolio composition")

    volatility_tolerance: float = Field(..., ge=0, le=100, description="Tolerance for price volatility")
    loss_tolerance: float = Field(..., ge=0, le=100, description="Tolerance for potential losses")
    time_recovery: int = Field(..., ge=1, le=365, description="Days to recover from significant loss")

    assessment_date: datetime = Field(default_factory=datetime.utcnow, description="When assessment was performed")
    confidence_level: float = Field(..., ge=0, le=100, description="Confidence in assessment accuracy")


class InvestmentPreferences(BaseModel):
    """User investment preferences."""
    primary_goal: InvestmentGoal = Field(..., description="Primary investment objective")
    secondary_goals: List[InvestmentGoal] = Field(default_factory=list, description="Secondary investment objectives")

    time_horizon: InvestmentHorizon = Field(..., description="Preferred investment time horizon")
    expected_returns: float = Field(..., ge=0, le=50, description="Expected annual returns (%)")

    sector_preferences: Dict[SectorPreference, float] = Field(
        default_factory=dict,
        description="Sector preferences with weights (0-100)"
    )

    geographic_preferences: Dict[GeographicPreference, float] = Field(
        default_factory=dict,
        description="Geographic preferences with weights (0-100)"
    )

    asset_class_weights: Dict[str, float] = Field(
        default_factory=dict,
        description="Preferred asset class weights (stocks, bonds, cash, etc.)"
    )

    excluded_sectors: List[SectorPreference] = Field(
        default_factory=list,
        description="Sectors to exclude from recommendations"
    )

    ethical_constraints: List[str] = Field(
        default_factory=list,
        description="Ethical or ESG constraints"
    )

    max_single_position: float = Field(..., ge=0, le=100, description="Maximum weight for single position (%)")
    max_sector_weight: float = Field(..., ge=0, le=100, description="Maximum weight for single sector (%)")


class BehavioralProfile(BaseModel):
    """User behavioral finance profile."""
    loss_aversion: float = Field(..., ge=0, le=10, description="Loss aversion coefficient (prospect theory)")
    recency_bias: float = Field(..., ge=0, le=10, description="Tendency to overweight recent events")
    confirmation_bias: float = Field(..., ge=0, le=10, description="Tendency to seek confirming information")

    disposition_effect: bool = Field(..., description="Tendency to sell winners too early, hold losers too long")
    herd_behavior: float = Field(..., ge=0, le=10, description="Tendency to follow market trends")
    overconfidence: float = Field(..., ge=0, le=10, description="Overconfidence in investment abilities")

    trading_frequency: str = Field(..., description="Typical trading frequency (daily, weekly, monthly, etc.)")
    reaction_to_volatility: str = Field(..., description="Reaction to market volatility (buy, sell, hold)")

    cognitive_biases: List[str] = Field(
        default_factory=list,
        description="Identified cognitive biases"
    )


class PortfolioConstraints(BaseModel):
    """Portfolio-level constraints."""
    total_value: float = Field(..., ge=0, description="Total portfolio value")
    available_cash: float = Field(..., ge=0, description="Available cash for investment")

    min_diversification: int = Field(..., ge=1, le=100, description="Minimum number of positions")
    max_positions: int = Field(..., ge=1, le=500, description="Maximum number of positions")

    tax_situation: Dict[str, Any] = Field(
        default_factory=dict,
        description="Tax situation and constraints"
    )

    regulatory_constraints: List[str] = Field(
        default_factory=list,
        description="Regulatory constraints (Colombian market specific)"
    )


class UserProfile(BaseModel):
    """Complete user investment profile."""
    user_id: str = Field(..., description="Unique user identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Profile creation date")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Profile last update")

    # Core assessments
    risk_tolerance: RiskToleranceAssessment = Field(..., description="Risk tolerance assessment")
    preferences: InvestmentPreferences = Field(..., description="Investment preferences")
    behavioral_profile: BehavioralProfile = Field(..., description="Behavioral finance profile")

    # Portfolio information
    current_portfolio: Optional[PortfolioConstraints] = Field(None, description="Current portfolio constraints")

    # Metadata
    profile_completeness: float = Field(..., ge=0, le=100, description="Profile completeness percentage")
    last_assessment_date: datetime = Field(default_factory=datetime.utcnow, description="Last full assessment")
    data_sources: List[str] = Field(default_factory=list, description="Sources of profile data")

    # Colombian market specific
    colombian_investor_type: Optional[str] = Field(None, description="Colombian regulatory investor classification")
    trm_sensitivity: Optional[float] = Field(None, ge=0, le=10, description="Sensitivity to TRM fluctuations")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "risk_tolerance": {
                    "overall_score": 65.0,
                    "level": "moderate",
                    "volatility_tolerance": 60.0,
                    "loss_tolerance": 70.0
                },
                "preferences": {
                    "primary_goal": "growth",
                    "time_horizon": "long_term",
                    "expected_returns": 8.0,
                    "sector_preferences": {
                        "technology": 80.0,
                        "healthcare": 60.0
                    }
                },
                "behavioral_profile": {
                    "loss_aversion": 2.5,
                    "recency_bias": 3.0,
                    "confirmation_bias": 4.0
                }
            }
        }


class UserProfileUpdate(BaseModel):
    """Updates to user profile."""
    risk_tolerance: Optional[RiskToleranceAssessment] = None
    preferences: Optional[InvestmentPreferences] = None
    behavioral_profile: Optional[BehavioralProfile] = None
    current_portfolio: Optional[PortfolioConstraints] = None

    colombian_investor_type: Optional[str] = None
    trm_sensitivity: Optional[float] = None


class RiskQuestionnaireRequest(BaseModel):
    """Risk tolerance questionnaire request."""
    user_id: str = Field(..., description="User identifier")
    responses: Dict[str, Any] = Field(..., description="Questionnaire responses")

    @validator('responses')
    def validate_responses(cls, v):
        """Validate questionnaire responses."""
        required_questions = [
            'investment_experience',
            'reaction_to_loss',
            'investment_horizon',
            'comfort_with_volatility'
        ]

        for question in required_questions:
            if question not in v:
                raise ValueError(f'Missing required question: {question}')

        return v


class RiskQuestionnaireResponse(BaseModel):
    """Risk tolerance questionnaire response."""
    user_id: str = Field(..., description="User identifier")
    assessment: RiskToleranceAssessment = Field(..., description="Calculated risk assessment")
    recommendations: List[str] = Field(..., description="Personalized recommendations based on assessment")


class PreferenceAnalysisRequest(BaseModel):
    """Request for preference analysis."""
    user_id: str = Field(..., description="User identifier")
    portfolio_history: Optional[List[Dict[str, Any]]] = Field(None, description="Historical portfolio data")
    trading_history: Optional[List[Dict[str, Any]]] = Field(None, description="Historical trading data")
    survey_responses: Optional[Dict[str, Any]] = Field(None, description="Preference survey responses")


class PreferenceAnalysisResponse(BaseModel):
    """Response from preference analysis."""
    user_id: str = Field(..., description="User identifier")
    preferences: InvestmentPreferences = Field(..., description="Analyzed preferences")
    confidence_scores: Dict[str, float] = Field(..., description="Confidence scores for each preference")
    recommendations: List[str] = Field(..., description="Suggestions for improving preferences")