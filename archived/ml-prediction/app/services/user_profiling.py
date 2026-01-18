"""User profiling and personalization services."""

from typing import Dict, List, Any, Optional, Tuple
import structlog
from datetime import datetime, timedelta
import statistics

from app.schemas.user_profile import (
    UserProfile,
    RiskToleranceAssessment,
    RiskToleranceLevel,
    InvestmentPreferences,
    InvestmentGoal,
    InvestmentHorizon,
    BehavioralProfile,
    RiskQuestionnaireRequest,
    RiskQuestionnaireResponse,
    PreferenceAnalysisRequest,
    PreferenceAnalysisResponse
)
from app.core.config import settings

logger = structlog.get_logger()


class RiskToleranceEngine:
    """Engine for assessing user risk tolerance."""

    def __init__(self):
        self.questionnaire_weights = {
            'investment_experience': 0.15,
            'reaction_to_loss': 0.25,
            'investment_horizon': 0.20,
            'comfort_with_volatility': 0.20,
            'emergency_fund': 0.10,
            'age_factor': 0.10
        }

    async def assess_from_questionnaire(self, request: RiskQuestionnaireRequest) -> RiskToleranceAssessment:
        """Assess risk tolerance from questionnaire responses."""

        responses = request.responses
        scores = {}

        # Calculate individual question scores
        scores['investment_experience'] = self._score_investment_experience(responses.get('investment_experience', {}))
        scores['reaction_to_loss'] = self._score_loss_reaction(responses.get('reaction_to_loss', ''))
        scores['investment_horizon'] = self._score_investment_horizon(responses.get('investment_horizon', ''))
        scores['comfort_with_volatility'] = self._score_volatility_comfort(responses.get('comfort_with_volatility', 5))
        scores['emergency_fund'] = self._score_emergency_fund(responses.get('emergency_fund', False))
        scores['age_factor'] = self._score_age_factor(responses.get('age', 30))

        # Calculate weighted overall score
        overall_score = sum(scores[question] * weight for question, weight in self.questionnaire_weights.items())

        # Determine risk level
        level = self._determine_risk_level(overall_score)

        # Calculate additional metrics
        volatility_tolerance = self._calculate_volatility_tolerance(scores)
        loss_tolerance = self._calculate_loss_tolerance(scores)
        time_recovery = self._calculate_recovery_time(scores)

        return RiskToleranceAssessment(
            overall_score=round(overall_score, 1),
            level=level,
            questionnaire_score=round(overall_score, 1),
            volatility_tolerance=round(volatility_tolerance, 1),
            loss_tolerance=round(loss_tolerance, 1),
            time_recovery=time_recovery,
            confidence_level=85.0  # High confidence for direct questionnaire
        )

    async def assess_from_behavior(self, user_id: str, trading_history: List[Dict[str, Any]]) -> Optional[RiskToleranceAssessment]:
        """Assess risk tolerance from behavioral data."""

        if not trading_history:
            return None

        try:
            # Analyze trading patterns
            position_sizes = [trade.get('position_size', 0) for trade in trading_history]
            holding_periods = []

            for trade in trading_history:
                if 'entry_date' in trade and 'exit_date' in trade:
                    entry = datetime.fromisoformat(trade['entry_date'].replace('Z', '+00:00'))
                    exit_date = datetime.fromisoformat(trade['exit_date'].replace('Z', '+00:00'))
                    holding_periods.append((exit_date - entry).days)

            # Calculate behavioral metrics
            avg_position_size = statistics.mean(position_sizes) if position_sizes else 0
            avg_holding_period = statistics.mean(holding_periods) if holding_periods else 30

            # Convert to risk score
            behavioral_score = self._calculate_behavioral_risk_score(avg_position_size, avg_holding_period, trading_history)

            level = self._determine_risk_level(behavioral_score)

            return RiskToleranceAssessment(
                overall_score=round(behavioral_score, 1),
                level=level,
                behavioral_score=round(behavioral_score, 1),
                volatility_tolerance=round(behavioral_score * 0.8, 1),
                loss_tolerance=round(behavioral_score * 0.9, 1),
                time_recovery=int(30 + (100 - behavioral_score) * 2),  # 30-230 days
                confidence_level=70.0  # Moderate confidence for behavioral analysis
            )

        except Exception as e:
            logger.error("Failed to assess behavioral risk tolerance", user_id=user_id, error=str(e))
            return None

    async def assess_from_portfolio(self, user_id: str, portfolio: Dict[str, Any]) -> Optional[RiskToleranceAssessment]:
        """Assess risk tolerance from portfolio composition."""

        try:
            holdings = portfolio.get('holdings', [])

            if not holdings:
                return None

            # Calculate portfolio metrics
            total_value = sum(holding.get('value', 0) for holding in holdings)
            sector_diversification = len(set(h.get('sector', 'unknown') for h in holdings))

            # Risk metrics based on portfolio composition
            tech_weight = sum(h.get('value', 0) for h in holdings if h.get('sector') == 'technology') / total_value
            volatility_stocks = sum(h.get('value', 0) for h in holdings if h.get('volatility', 'medium') == 'high') / total_value

            portfolio_score = self._calculate_portfolio_risk_score(tech_weight, volatility_stocks, sector_diversification)

            level = self._determine_risk_level(portfolio_score)

            return RiskToleranceAssessment(
                overall_score=round(portfolio_score, 1),
                level=level,
                portfolio_based_score=round(portfolio_score, 1),
                volatility_tolerance=round(portfolio_score * 0.85, 1),
                loss_tolerance=round(portfolio_score * 0.95, 1),
                time_recovery=int(20 + (100 - portfolio_score) * 1.5),  # 20-170 days
                confidence_level=60.0  # Lower confidence for portfolio-based assessment
            )

        except Exception as e:
            logger.error("Failed to assess portfolio-based risk tolerance", user_id=user_id, error=str(e))
            return None

    def _score_investment_experience(self, experience: Dict[str, Any]) -> float:
        """Score investment experience."""
        years = experience.get('years', 0)
        types = experience.get('types', [])

        base_score = min(years * 5, 50)  # Max 50 points for experience

        # Bonus for diverse experience
        if 'stocks' in types:
            base_score += 10
        if 'options' in types or 'futures' in types:
            base_score += 15

        return min(base_score, 100)

    def _score_loss_reaction(self, reaction: str) -> float:
        """Score reaction to losses."""
        reaction_scores = {
            'sell_everything': 10,
            'sell_some': 30,
            'hold_and_wait': 50,
            'buy_more': 80,
            'see_as_opportunity': 90
        }
        return reaction_scores.get(reaction, 50)

    def _score_investment_horizon(self, horizon: str) -> float:
        """Score investment horizon."""
        horizon_scores = {
            'less_than_1_year': 20,
            '1_3_years': 40,
            '3_5_years': 60,
            '5_10_years': 80,
            'more_than_10_years': 100
        }
        return horizon_scores.get(horizon, 50)

    def _score_volatility_comfort(self, comfort_level: int) -> float:
        """Score comfort with volatility (1-10 scale)."""
        return comfort_level * 10

    def _score_emergency_fund(self, has_emergency_fund: bool) -> float:
        """Score emergency fund availability."""
        return 80 if has_emergency_fund else 30

    def _score_age_factor(self, age: int) -> float:
        """Score based on age (younger = higher risk tolerance)."""
        if age < 30:
            return 80
        elif age < 40:
            return 70
        elif age < 50:
            return 60
        elif age < 60:
            return 50
        else:
            return 40

    def _calculate_volatility_tolerance(self, scores: Dict[str, float]) -> float:
        """Calculate volatility tolerance from individual scores."""
        return (scores['comfort_with_volatility'] * 0.4 +
                scores['reaction_to_loss'] * 0.3 +
                scores['investment_experience'] * 0.3)

    def _calculate_loss_tolerance(self, scores: Dict[str, float]) -> float:
        """Calculate loss tolerance from individual scores."""
        return (scores['reaction_to_loss'] * 0.5 +
                scores['emergency_fund'] * 0.3 +
                scores['investment_experience'] * 0.2)

    def _calculate_recovery_time(self, scores: Dict[str, float]) -> int:
        """Calculate time to recover from losses (in days)."""
        base_time = 30
        loss_reaction_penalty = (100 - scores['reaction_to_loss']) * 2
        emergency_fund_bonus = (scores['emergency_fund'] - 50) * 0.5

        return int(max(7, base_time + loss_reaction_penalty - emergency_fund_bonus))

    def _calculate_behavioral_risk_score(self, avg_position_size: float, avg_holding_period: float, trading_history: List[Dict[str, Any]]) -> float:
        """Calculate risk score from behavioral data."""
        # Larger position sizes indicate higher risk tolerance
        position_score = min(avg_position_size * 10, 100)

        # Longer holding periods indicate lower risk tolerance
        holding_score = max(0, 100 - (avg_holding_period - 30) * 2)

        # Frequency of trading
        trades_per_month = len(trading_history) / max(1, (datetime.utcnow() - datetime.utcnow().replace(day=1)).days / 30)
        frequency_score = min(trades_per_month * 5, 100)

        return (position_score * 0.4 + holding_score * 0.4 + frequency_score * 0.2)

    def _calculate_portfolio_risk_score(self, tech_weight: float, volatility_stocks: float, diversification: int) -> float:
        """Calculate risk score from portfolio composition."""
        tech_score = tech_weight * 100  # Tech-heavy = higher risk
        volatility_score = volatility_stocks * 100  # Volatile stocks = higher risk
        diversification_bonus = min(diversification * 5, 30)  # More diversification = lower risk

        base_score = (tech_score * 0.3 + volatility_score * 0.4)
        return max(0, base_score - diversification_bonus)

    def _determine_risk_level(self, score: float) -> RiskToleranceLevel:
        """Determine risk tolerance level from score."""
        if score <= 25:
            return RiskToleranceLevel.CONSERVATIVE
        elif score <= 40:
            return RiskToleranceLevel.MODERATE_CONSERVATIVE
        elif score <= 60:
            return RiskToleranceLevel.MODERATE
        elif score <= 75:
            return RiskToleranceLevel.MODERATE_AGGRESSIVE
        else:
            return RiskToleranceLevel.AGGRESSIVE


class PreferenceAnalysisEngine:
    """Engine for analyzing user investment preferences."""

    async def analyze_preferences(self, request: PreferenceAnalysisRequest) -> PreferenceAnalysisResponse:
        """Analyze user preferences from various data sources."""

        preferences = InvestmentPreferences(
            primary_goal=InvestmentGoal.GROWTH,  # Default
            time_horizon=InvestmentHorizon.MEDIUM_TERM,  # Default
            expected_returns=7.0  # Default 7%
        )

        confidence_scores = {}

        # Analyze from survey responses
        if request.survey_responses:
            preferences, survey_confidence = await self._analyze_survey_responses(request.survey_responses)
            confidence_scores['survey'] = survey_confidence

        # Analyze from portfolio history
        if request.portfolio_history:
            portfolio_prefs, portfolio_confidence = await self._analyze_portfolio_history(request.portfolio_history)
            preferences = self._merge_preferences(preferences, portfolio_prefs, 0.6)
            confidence_scores['portfolio'] = portfolio_confidence

        # Analyze from trading history
        if request.trading_history:
            trading_prefs, trading_confidence = await self._analyze_trading_history(request.trading_history)
            preferences = self._merge_preferences(preferences, trading_prefs, 0.4)
            confidence_scores['trading'] = trading_confidence

        recommendations = self._generate_preference_recommendations(preferences, confidence_scores)

        return PreferenceAnalysisResponse(
            user_id=request.user_id,
            preferences=preferences,
            confidence_scores=confidence_scores,
            recommendations=recommendations
        )

    async def _analyze_survey_responses(self, survey: Dict[str, Any]) -> Tuple[InvestmentPreferences, float]:
        """Analyze preferences from survey responses."""
        preferences = InvestmentPreferences(
            primary_goal=InvestmentGoal(survey.get('primary_goal', 'growth')),
            time_horizon=InvestmentHorizon(survey.get('time_horizon', 'medium_term')),
            expected_returns=float(survey.get('expected_returns', 7.0))
        )

        # Add sector preferences
        sector_prefs = survey.get('sector_preferences', {})
        preferences.sector_preferences = {k: float(v) for k, v in sector_prefs.items()}

        return preferences, 90.0  # High confidence for direct survey

    async def _analyze_portfolio_history(self, portfolio_history: List[Dict[str, Any]]) -> Tuple[InvestmentPreferences, float]:
        """Analyze preferences from portfolio composition history."""
        if not portfolio_history:
            return InvestmentPreferences(), 0.0

        # Analyze sector allocation patterns
        sector_weights = {}
        total_periods = len(portfolio_history)

        for period in portfolio_history:
            holdings = period.get('holdings', [])
            for holding in holdings:
                sector = holding.get('sector', 'unknown')
                weight = holding.get('weight', 0)
                sector_weights[sector] = sector_weights.get(sector, 0) + weight / total_periods

        preferences = InvestmentPreferences(
            sector_preferences=sector_weights
        )

        return preferences, 75.0  # Moderate confidence

    async def _analyze_trading_history(self, trading_history: List[Dict[str, Any]]) -> Tuple[InvestmentPreferences, float]:
        """Analyze preferences from trading patterns."""
        if not trading_history:
            return InvestmentPreferences(), 0.0

        # Analyze trading frequency and style
        total_trades = len(trading_history)
        time_span_days = 365  # Assume 1 year of data

        trades_per_month = total_trades / (time_span_days / 30)

        # Determine time horizon based on trading frequency
        if trades_per_month > 10:
            horizon = InvestmentHorizon.SHORT_TERM
        elif trades_per_month > 4:
            horizon = InvestmentHorizon.MEDIUM_TERM
        else:
            horizon = InvestmentHorizon.LONG_TERM

        preferences = InvestmentPreferences(
            time_horizon=horizon
        )

        return preferences, 65.0  # Lower confidence for indirect analysis

    def _merge_preferences(self, base: InvestmentPreferences, additional: InvestmentPreferences, weight: float) -> InvestmentPreferences:
        """Merge preferences with weighting."""
        # Simple merging logic - in production, this would be more sophisticated
        if additional.primary_goal and not base.primary_goal:
            base.primary_goal = additional.primary_goal

        if additional.time_horizon and not base.time_horizon:
            base.time_horizon = additional.time_horizon

        # Merge sector preferences
        for sector, weight_add in additional.sector_preferences.items():
            current_weight = base.sector_preferences.get(sector, 0)
            base.sector_preferences[sector] = current_weight * (1 - weight) + weight_add * weight

        return base

    def _generate_preference_recommendations(self, preferences: InvestmentPreferences, confidence_scores: Dict[str, float]) -> List[str]:
        """Generate recommendations for improving preferences."""
        recommendations = []

        avg_confidence = sum(confidence_scores.values()) / len(confidence_scores) if confidence_scores else 0

        if avg_confidence < 70:
            recommendations.append("Consider completing a detailed investment preferences survey for more accurate recommendations")

        if len(preferences.sector_preferences) < 3:
            recommendations.append("Diversify across more sectors to reduce risk and improve returns")

        if not preferences.ethical_constraints and len(preferences.ethical_constraints) == 0:
            recommendations.append("Consider defining ESG preferences for socially responsible investing")

        return recommendations


class UserProfilingService:
    """Main service for user profiling and personalization."""

    def __init__(self):
        self.risk_engine = RiskToleranceEngine()
        self.preference_engine = PreferenceAnalysisEngine()

    async def build_user_profile(self, user_id: str, **kwargs) -> UserProfile:
        """Build complete user profile from available data."""

        # Get risk tolerance assessments
        risk_assessments = []

        # From questionnaire if available
        questionnaire_data = kwargs.get('questionnaire')
        if questionnaire_data:
            questionnaire_request = RiskQuestionnaireRequest(user_id=user_id, responses=questionnaire_data)
            risk_assessment = await self.risk_engine.assess_from_questionnaire(questionnaire_request)
            risk_assessments.append(('questionnaire', risk_assessment))

        # From behavioral data
        trading_history = kwargs.get('trading_history', [])
        if trading_history:
            behavioral_assessment = await self.risk_engine.assess_from_behavior(user_id, trading_history)
            if behavioral_assessment:
                risk_assessments.append(('behavioral', behavioral_assessment))

        # From portfolio data
        portfolio_data = kwargs.get('portfolio')
        if portfolio_data:
            portfolio_assessment = await self.risk_engine.assess_from_portfolio(user_id, portfolio_data)
            if portfolio_assessment:
                risk_assessments.append(('portfolio', portfolio_assessment))

        # Combine risk assessments
        final_risk_tolerance = self._combine_risk_assessments(risk_assessments)

        # Analyze preferences
        preference_request = PreferenceAnalysisRequest(
            user_id=user_id,
            portfolio_history=kwargs.get('portfolio_history'),
            trading_history=trading_history,
            survey_responses=kwargs.get('survey_responses')
        )
        preference_analysis = await self.preference_engine.analyze_preferences(preference_request)

        # Build behavioral profile (simplified)
        behavioral_profile = BehavioralProfile(
            loss_aversion=2.5,  # Default moderate loss aversion
            recency_bias=3.0,
            confirmation_bias=4.0,
            disposition_effect=False,
            herd_behavior=5.0,
            overconfidence=6.0,
            trading_frequency="monthly",
            reaction_to_volatility="hold"
        )

        # Calculate profile completeness
        completeness = self._calculate_profile_completeness(risk_assessments, preference_analysis)

        return UserProfile(
            user_id=user_id,
            risk_tolerance=final_risk_tolerance,
            preferences=preference_analysis.preferences,
            behavioral_profile=behavioral_profile,
            profile_completeness=completeness,
            data_sources=[source for source, _ in risk_assessments] + ['preferences_analysis']
        )

    def _combine_risk_assessments(self, assessments: List[Tuple[str, RiskToleranceAssessment]]) -> RiskToleranceAssessment:
        """Combine multiple risk assessments into final assessment."""
        if not assessments:
            # Return default moderate risk tolerance
            return RiskToleranceAssessment(
                overall_score=50.0,
                level=RiskToleranceLevel.MODERATE,
                volatility_tolerance=50.0,
                loss_tolerance=50.0,
                time_recovery=60,
                confidence_level=30.0
            )

        # Weight assessments by confidence and recency
        weights = {
            'questionnaire': 0.5,  # Highest weight for direct questionnaire
            'behavioral': 0.3,     # Moderate weight for behavioral analysis
            'portfolio': 0.2       # Lower weight for portfolio-based assessment
        }

        weighted_scores = []
        total_weight = 0

        for source, assessment in assessments:
            weight = weights.get(source, 0.1)
            weighted_scores.append(assessment.overall_score * weight)
            total_weight += weight

        final_score = sum(weighted_scores) / total_weight if total_weight > 0 else 50.0

        return RiskToleranceAssessment(
            overall_score=round(final_score, 1),
            level=self.risk_engine._determine_risk_level(final_score),
            volatility_tolerance=round(final_score * 0.8, 1),
            loss_tolerance=round(final_score * 0.9, 1),
            time_recovery=int(30 + (100 - final_score) * 1.5),
            confidence_level=80.0  # Good confidence when combining multiple sources
        )

    def _calculate_profile_completeness(self, risk_assessments: List, preference_analysis: PreferenceAnalysisResponse) -> float:
        """Calculate profile completeness percentage."""
        completeness = 0.0

        # Risk assessment completeness
        if risk_assessments:
            completeness += 40.0
            if len(risk_assessments) > 1:
                completeness += 10.0  # Bonus for multiple assessment methods

        # Preferences completeness
        if preference_analysis.preferences.primary_goal:
            completeness += 15.0
        if preference_analysis.preferences.sector_preferences:
            completeness += 15.0
        if preference_analysis.preferences.time_horizon:
            completeness += 10.0

        # Behavioral profile completeness (assuming basic behavioral data)
        completeness += 10.0

        return min(completeness, 100.0)


# Global service instance
user_profiling_service = UserProfilingService()