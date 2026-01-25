"""Personalized investment recommendation engine."""

from typing import List, Dict, Any, Optional, Tuple
import structlog
from datetime import datetime
from enum import Enum
import numpy as np

from app.schemas.user_profile import UserProfile, RiskToleranceLevel
from app.schemas.recommendations import (
    RecommendationResponse,
    TechnicalIndicators,
    MLPrediction,
    MomentumIndicators
)
from app.core.llm_orchestrator import llm_orchestrator, TaskComplexity
from app.services.user_profiling import user_profiling_service
from app.core.scoring import score_calculator
from app.core.config import settings

logger = structlog.get_logger()


class RecommendationEngine:
    """Engine for generating personalized investment recommendations."""

    def __init__(self):
        self.llm_orchestrator = llm_orchestrator
        self.user_profiling = user_profiling_service
        self.score_calculator = score_calculator

    async def generate_personalized_recommendations(
        self,
        user_id: str,
        symbols: List[str],
        user_profile: Optional[UserProfile] = None,
        market_context: Optional[Dict[str, Any]] = None,
        portfolio_context: Optional[Dict[str, Any]] = None
    ) -> List[RecommendationResponse]:
        """
        Generate personalized recommendations for multiple symbols.

        Args:
            user_id: User identifier
            symbols: List of stock symbols to analyze
            user_profile: Pre-loaded user profile (optional)
            market_context: Additional market context
            portfolio_context: Current portfolio information

        Returns:
            List of personalized recommendation responses
        """

        logger.info("Generating personalized recommendations",
                   user_id=user_id,
                   symbols=symbols,
                   symbol_count=len(symbols))

        # Get or build user profile
        if not user_profile:
            user_profile = await self._get_user_profile(user_id)

        # Determine task complexity based on user profile
        task_complexity = self._determine_task_complexity(user_profile)

        recommendations = []

        for symbol in symbols:
            try:
                # Generate recommendation for individual symbol
                recommendation = await self._generate_single_recommendation(
                    symbol=symbol,
                    user_profile=user_profile,
                    task_complexity=task_complexity,
                    market_context=market_context,
                    portfolio_context=portfolio_context
                )

                recommendations.append(recommendation)

            except Exception as e:
                logger.error("Failed to generate recommendation for symbol",
                           symbol=symbol, user_id=user_id, error=str(e))

                # Return basic recommendation on failure
                recommendations.append(self._create_fallback_recommendation(symbol, user_id))

        logger.info("Generated personalized recommendations",
                   user_id=user_id,
                   successful=len(recommendations),
                   total=len(symbols))

        return recommendations

    async def _get_user_profile(self, user_id: str) -> UserProfile:
        """Get or create user profile."""
        try:
            # In a real implementation, this would fetch from database
            # For now, create a basic profile
            return await self.user_profiling.build_user_profile(user_id)
        except Exception as e:
            logger.warning("Failed to build user profile, using defaults", user_id=user_id, error=str(e))
            # Return a default moderate profile
            return self._create_default_profile(user_id)

    def _determine_task_complexity(self, user_profile: UserProfile) -> TaskComplexity:
        """Determine task complexity based on user profile."""
        risk_level = user_profile.risk_tolerance.level

        # High risk tolerance users get more complex analysis
        if risk_level in [RiskToleranceLevel.AGGRESSIVE, RiskToleranceLevel.MODERATE_AGGRESSIVE]:
            return TaskComplexity.HIGH
        elif risk_level == RiskToleranceLevel.MODERATE:
            return TaskComplexity.MEDIUM
        else:
            return TaskComplexity.LOW

    async def _generate_single_recommendation(
        self,
        symbol: str,
        user_profile: UserProfile,
        task_complexity: TaskComplexity,
        market_context: Optional[Dict[str, Any]] = None,
        portfolio_context: Optional[Dict[str, Any]] = None
    ) -> RecommendationResponse:
        """Generate recommendation for a single symbol."""

        # Gather context data
        context_data = await self._gather_context_data(
            symbol=symbol,
            user_profile=user_profile,
            market_context=market_context,
            portfolio_context=portfolio_context
        )

        # Generate LLM-powered recommendation
        llm_result = await self.llm_orchestrator.generate_recommendation(
            symbol=symbol,
            user_id=user_profile.user_id,
            context_data=context_data,
            task_complexity=task_complexity
        )

        # Get traditional technical analysis
        technical_data = await self._get_technical_analysis(symbol)

        # Apply user-specific adjustments
        adjusted_recommendation = await self._apply_user_adjustments(
            llm_result['recommendation'],
            user_profile,
            technical_data
        )

        # Build final response
        return RecommendationResponse(
            symbol=symbol,
            signal=adjusted_recommendation['signal'],
            score=adjusted_recommendation['score'],
            confidence=adjusted_recommendation['confidence'],
            reasons=adjusted_recommendation['reasons'],
            indicators=technical_data.get('indicators', TechnicalIndicators()),
            ml_prediction=technical_data.get('ml_prediction'),
            momentum=technical_data.get('momentum'),
            current_price=technical_data.get('current_price', 0.0),
            timestamp=datetime.utcnow(),
            personalized_data={
                "user_risk_level": user_profile.risk_tolerance.level.value,
                "task_complexity": task_complexity.value,
                "model_used": llm_result.get('model_used'),
                "profile_completeness": user_profile.profile_completeness
            }
        )

    async def _gather_context_data(
        self,
        symbol: str,
        user_profile: UserProfile,
        market_context: Optional[Dict[str, Any]] = None,
        portfolio_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Gather comprehensive context data for LLM processing."""

        context = {
            "user_profile": {
                "risk_tolerance": user_profile.risk_tolerance.level.value,
                "investment_goals": [goal.value for goal in user_profile.preferences.secondary_goals],
                "time_horizon": user_profile.preferences.time_horizon.value,
                "sector_preferences": user_profile.preferences.sector_preferences,
                "excluded_sectors": [s.value for s in user_profile.preferences.excluded_sectors]
            },
            "behavioral_factors": {
                "loss_aversion": user_profile.behavioral_profile.loss_aversion,
                "risk_adjustment": self._calculate_risk_adjustment(user_profile)
            }
        }

        # Add market context if provided
        if market_context:
            context["market_data"] = market_context.get("market_data", {})
            context["technical_indicators"] = market_context.get("technical_indicators", {})
            context["sentiment"] = market_context.get("sentiment", {})

        # Add portfolio context
        if portfolio_context:
            context["portfolio"] = {
                "current_holdings": portfolio_context.get("holdings", []),
                "total_value": portfolio_context.get("total_value", 0),
                "sector_allocation": portfolio_context.get("sector_allocation", {}),
                "risk_metrics": portfolio_context.get("risk_metrics", {})
            }

        return context

    async def _get_technical_analysis(self, symbol: str) -> Dict[str, Any]:
        """Get technical analysis data (placeholder for integration with analysis-engine)."""
        # In a real implementation, this would call the analysis-engine service
        # For now, return mock data

        return {
            "current_price": 100.0,  # Mock price
            "indicators": TechnicalIndicators(
                rsi=65.0,
                macd={"macd": 1.2, "signal": 0.8, "histogram": 0.4},
                volume=1000000,
                price_change_pct=2.5,
                sma_20=98.0,
                bollinger_upper=105.0,
                bollinger_lower=95.0
            ),
            "ml_prediction": MLPrediction(
                trend="bullish",
                trend_confidence=75.0,
                price_volatility=15.0
            ),
            "momentum": MomentumIndicators(
                velocity=1.5,
                acceleration=0.2,
                slope=0.8,
                volatility=12.0
            )
        }

    async def _apply_user_adjustments(
        self,
        llm_recommendation: Dict[str, Any],
        user_profile: UserProfile,
        technical_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply user-specific adjustments to the LLM recommendation."""

        adjusted = llm_recommendation.copy()

        # Adjust confidence based on profile completeness
        completeness_factor = user_profile.profile_completeness / 100.0
        adjusted['confidence'] = min(adjusted['confidence'] * completeness_factor, 100.0)

        # Apply risk-based adjustments
        risk_adjustment = self._calculate_risk_adjustment(user_profile)

        if risk_adjustment < 0.8:  # Conservative user
            # Reduce aggressive signals
            if adjusted['signal'] == 'BUY' and adjusted['confidence'] > 70:
                adjusted['confidence'] *= 0.9
                adjusted['reasons'].append("Signal moderated for conservative risk profile")

        elif risk_adjustment > 1.2:  # Aggressive user
            # Amplify moderate signals
            if adjusted['signal'] == 'HOLD' and adjusted['confidence'] < 60:
                adjusted['signal'] = 'BUY'
                adjusted['confidence'] = min(adjusted['confidence'] * 1.1, 100)
                adjusted['reasons'].append("Signal upgraded for aggressive risk profile")

        # Apply behavioral adjustments
        behavioral_adjustment = self._apply_behavioral_adjustments(adjusted, user_profile)

        return behavioral_adjustment

    def _calculate_risk_adjustment(self, user_profile: UserProfile) -> float:
        """Calculate risk adjustment factor based on user profile."""
        base_risk_score = user_profile.risk_tolerance.overall_score

        # Convert to multiplier (0.5 = very conservative, 1.5 = very aggressive)
        return 0.5 + (base_risk_score / 100.0)

    def _apply_behavioral_adjustments(
        self,
        recommendation: Dict[str, Any],
        user_profile: UserProfile
    ) -> Dict[str, Any]:
        """Apply behavioral finance adjustments."""

        adjusted = recommendation.copy()

        behavioral = user_profile.behavioral_profile

        # Loss aversion adjustment
        if behavioral.loss_aversion > 3.0 and recommendation['signal'] == 'BUY':
            # High loss aversion users are more cautious
            adjusted['confidence'] *= 0.95
            if "Consider potential downside risk" not in adjusted['reasons']:
                adjusted['reasons'].append("Consider potential downside risk")

        # Recency bias adjustment
        if behavioral.recency_bias > 4.0:
            # Users with high recency bias may overreact to recent events
            adjusted['reasons'].append("Recent market events may influence this analysis")

        # Disposition effect
        if behavioral.disposition_effect:
            if recommendation['signal'] == 'AVOID':
                adjusted['reasons'].append("Consider tax implications of selling")

        return adjusted

    def _create_fallback_recommendation(self, symbol: str, user_id: str) -> RecommendationResponse:
        """Create a basic fallback recommendation when generation fails."""
        return RecommendationResponse(
            symbol=symbol,
            signal="HOLD",
            score=50.0,
            confidence=30.0,
            reasons=["Unable to generate detailed analysis", "Recommend holding current position"],
            indicators=TechnicalIndicators(),
            current_price=0.0,
            timestamp=datetime.utcnow()
        )

    def _create_default_profile(self, user_id: str) -> UserProfile:
        """Create a default user profile when none exists."""
        from app.schemas.user_profile import (
            RiskToleranceAssessment, RiskToleranceLevel,
            InvestmentPreferences, InvestmentGoal, InvestmentHorizon,
            BehavioralProfile
        )

        return UserProfile(
            user_id=user_id,
            risk_tolerance=RiskToleranceAssessment(
                overall_score=50.0,
                level=RiskToleranceLevel.MODERATE,
                volatility_tolerance=50.0,
                loss_tolerance=50.0,
                time_recovery=60,
                confidence_level=50.0
            ),
            preferences=InvestmentPreferences(
                primary_goal=InvestmentGoal.GROWTH,
                time_horizon=InvestmentHorizon.MEDIUM_TERM,
                expected_returns=7.0
            ),
            behavioral_profile=BehavioralProfile(
                loss_aversion=2.5,
                recency_bias=3.0,
                confirmation_bias=4.0
            ),
            profile_completeness=30.0
        )

    async def get_recommendation_explanation(
        self,
        symbol: str,
        user_id: str,
        recommendation: RecommendationResponse
    ) -> Dict[str, Any]:
        """Generate detailed explanation for a recommendation."""

        context = {
            "symbol": symbol,
            "user_id": user_id,
            "signal": recommendation.signal,
            "confidence": recommendation.confidence,
            "key_factors": recommendation.reasons[:3]  # Top 3 reasons
        }

        llm_result = await self.llm_orchestrator.generate_recommendation(
            symbol=symbol,
            user_id=user_id,
            context_data={"explanation_request": context},
            task_complexity=TaskComplexity.MEDIUM
        )

        return {
            "symbol": symbol,
            "explanation": llm_result.get("recommendation", {}).get("detailed_explanation", "No detailed explanation available"),
            "key_insights": llm_result.get("recommendation", {}).get("key_insights", []),
            "risk_considerations": llm_result.get("recommendation", {}).get("risk_considerations", []),
            "alternative_scenarios": llm_result.get("recommendation", {}).get("alternative_scenarios", [])
        }


# Global recommendation engine instance
recommendation_engine = RecommendationEngine()