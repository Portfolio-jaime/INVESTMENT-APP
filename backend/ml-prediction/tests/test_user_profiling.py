"""Unit tests for user profiling and personalization services."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.user_profiling import (
    RiskToleranceEngine,
    PreferenceAnalysisEngine,
    UserProfilingService
)
from app.schemas.user_profile import (
    RiskToleranceLevel,
    RiskToleranceAssessment,
    InvestmentPreferences,
    InvestmentGoal,
    InvestmentHorizon,
    UserProfile,
    BehavioralProfile
)


class TestRiskToleranceEngine:
    """Test risk tolerance assessment engine."""

    @pytest.fixture
    def engine(self):
        """Create risk tolerance engine instance."""
        return RiskToleranceEngine()

    def test_initialization(self, engine):
        """Test engine initialization."""
        assert hasattr(engine, 'questionnaire_weights')
        assert len(engine.questionnaire_weights) == 6
        assert sum(engine.questionnaire_weights.values()) == 1.0  # Should sum to 1

    @pytest.mark.asyncio
    async def test_assess_from_questionnaire_conservative(self, engine):
        """Test conservative risk assessment from questionnaire."""
        request = type('MockRequest', (), {
            'responses': {
                'investment_experience': {'years': 1, 'types': []},
                'reaction_to_loss': 'sell_everything',
                'investment_horizon': 'less_than_1_year',
                'comfort_with_volatility': 2,  # Low comfort
                'emergency_fund': False,
                'age': 65
            }
        })()

        assessment = await engine.assess_from_questionnaire(request)

        assert assessment.level == RiskToleranceLevel.CONSERVATIVE
        assert assessment.overall_score < 30
        assert assessment.volatility_tolerance < 30
        assert assessment.confidence_level == 85.0

    @pytest.mark.asyncio
    async def test_assess_from_questionnaire_aggressive(self, engine):
        """Test aggressive risk assessment from questionnaire."""
        request = type('MockRequest', (), {
            'responses': {
                'investment_experience': {'years': 10, 'types': ['stocks', 'options', 'futures']},
                'reaction_to_loss': 'buy_more',
                'investment_horizon': 'more_than_10_years',
                'comfort_with_volatility': 9,  # High comfort
                'emergency_fund': True,
                'age': 25
            }
        })()

        assessment = await engine.assess_from_questionnaire(request)

        assert assessment.level == RiskToleranceLevel.AGGRESSIVE
        assert assessment.overall_score > 70
        assert assessment.volatility_tolerance > 70

    @pytest.mark.asyncio
    async def test_assess_from_behavior_high_risk(self, engine):
        """Test behavioral assessment with high risk tolerance."""
        trading_history = [
            {'position_size': 0.2, 'entry_date': '2023-01-01T00:00:00Z', 'exit_date': '2023-01-05T00:00:00Z'},
            {'position_size': 0.15, 'entry_date': '2023-01-06T00:00:00Z', 'exit_date': '2023-01-08T00:00:00Z'},
        ]

        assessment = await engine.assess_from_behavior("123", trading_history)

        assert assessment is not None
        assert assessment.behavioral_score is not None
        assert assessment.confidence_level == 70.0

    @pytest.mark.asyncio
    async def test_assess_from_behavior_no_history(self, engine):
        """Test behavioral assessment with no trading history."""
        assessment = await engine.assess_from_behavior("123", [])

        assert assessment is None

    @pytest.mark.asyncio
    async def test_assess_from_portfolio_tech_heavy(self, engine):
        """Test portfolio-based assessment for tech-heavy portfolio."""
        portfolio = {
            'holdings': [
                {'symbol': 'AAPL', 'value': 50000, 'sector': 'technology', 'weight': 0.4},
                {'symbol': 'MSFT', 'value': 30000, 'sector': 'technology', 'weight': 0.3},
                {'symbol': 'JPM', 'value': 20000, 'sector': 'financial', 'weight': 0.2},
                {'symbol': 'KO', 'value': 10000, 'sector': 'consumer', 'weight': 0.1}
            ]
        }

        assessment = await engine.assess_from_portfolio("123", portfolio)

        assert assessment is not None
        assert assessment.portfolio_based_score is not None
        assert assessment.confidence_level == 60.0

    def test_score_investment_experience(self, engine):
        """Test investment experience scoring."""
        # Beginner
        score = engine._score_investment_experience({'years': 0, 'types': []})
        assert score == 0

        # Experienced with diverse types
        score = engine._score_investment_experience({'years': 5, 'types': ['stocks', 'options']})
        assert score > 50

    def test_score_loss_reaction(self, engine):
        """Test loss reaction scoring."""
        assert engine._score_loss_reaction('sell_everything') == 10
        assert engine._score_loss_reaction('buy_more') == 80
        assert engine._score_loss_reaction('unknown') == 50

    def test_score_investment_horizon(self, engine):
        """Test investment horizon scoring."""
        assert engine._score_investment_horizon('less_than_1_year') == 20
        assert engine._score_investment_horizon('more_than_10_years') == 100
        assert engine._score_investment_horizon('unknown') == 50

    def test_score_volatility_comfort(self, engine):
        """Test volatility comfort scoring."""
        assert engine._score_volatility_comfort(1) == 10  # Min comfort
        assert engine._score_volatility_comfort(10) == 100  # Max comfort

    def test_score_emergency_fund(self, engine):
        """Test emergency fund scoring."""
        assert engine._score_emergency_fund(True) == 80
        assert engine._score_emergency_fund(False) == 30

    def test_score_age_factor(self, engine):
        """Test age factor scoring."""
        assert engine._score_age_factor(25) == 80  # Young, higher risk tolerance
        assert engine._score_age_factor(65) == 40  # Older, lower risk tolerance

    def test_determine_risk_level(self, engine):
        """Test risk level determination."""
        assert engine._determine_risk_level(15) == RiskToleranceLevel.CONSERVATIVE
        assert engine._determine_risk_level(45) == RiskToleranceLevel.MODERATE
        assert engine._determine_risk_level(75) == RiskToleranceLevel.AGGRESSIVE

    def test_calculate_volatility_tolerance(self, engine):
        """Test volatility tolerance calculation."""
        scores = {
            'comfort_with_volatility': 80,
            'reaction_to_loss': 60,
            'investment_experience': 70
        }

        tolerance = engine._calculate_volatility_tolerance(scores)
        assert 60 <= tolerance <= 100

    def test_calculate_loss_tolerance(self, engine):
        """Test loss tolerance calculation."""
        scores = {
            'reaction_to_loss': 70,
            'emergency_fund': 80,
            'investment_experience': 60
        }

        tolerance = engine._calculate_loss_tolerance(scores)
        assert 50 <= tolerance <= 100


class TestPreferenceAnalysisEngine:
    """Test preference analysis engine."""

    @pytest.fixture
    def engine(self):
        """Create preference analysis engine instance."""
        return PreferenceAnalysisEngine()

    @pytest.mark.asyncio
    async def test_analyze_preferences_survey_only(self, engine):
        """Test preference analysis with survey data only."""
        request = type('MockRequest', (), {
            'user_id': '123',
            'survey_responses': {
                'primary_goal': 'growth',
                'time_horizon': 'medium_term',
                'expected_returns': 8.0,
                'sector_preferences': {'technology': 0.8, 'healthcare': 0.6}
            },
            'portfolio_history': None,
            'trading_history': None
        })()

        response = await engine.analyze_preferences(request)

        assert response.user_id == '123'
        assert response.preferences.primary_goal == InvestmentGoal.GROWTH
        assert response.preferences.time_horizon == InvestmentHorizon.MEDIUM_TERM
        assert response.preferences.expected_returns == 8.0
        assert 'technology' in response.preferences.sector_preferences
        assert response.confidence_scores['survey'] == 90.0

    @pytest.mark.asyncio
    async def test_analyze_preferences_portfolio_only(self, engine):
        """Test preference analysis with portfolio data only."""
        portfolio_history = [
            {'holdings': [
                {'sector': 'technology', 'weight': 0.5},
                {'sector': 'financial', 'weight': 0.3},
                {'sector': 'technology', 'weight': 0.4}
            ]}
        ]

        request = type('MockRequest', (), {
            'user_id': '123',
            'survey_responses': None,
            'portfolio_history': portfolio_history,
            'trading_history': None
        })()

        response = await engine.analyze_preferences(request)

        assert response.user_id == '123'
        assert 'technology' in response.preferences.sector_preferences
        assert response.confidence_scores['portfolio'] == 75.0

    @pytest.mark.asyncio
    async def test_analyze_preferences_trading_only(self, engine):
        """Test preference analysis with trading data only."""
        trading_history = [
            {'symbol': 'AAPL', 'action': 'BUY'},  # 12 trades
            {'symbol': 'MSFT', 'action': 'BUY'},
        ] * 6  # 12 total

        request = type('MockRequest', (), {
            'user_id': '123',
            'survey_responses': None,
            'portfolio_history': None,
            'trading_history': trading_history
        })()

        response = await engine.analyze_preferences(request)

        assert response.user_id == '123'
        assert response.preferences.time_horizon == InvestmentHorizon.MEDIUM_TERM
        assert response.confidence_scores['trading'] == 65.0

    def test_merge_preferences(self, engine):
        """Test preference merging logic."""
        base = InvestmentPreferences(
            primary_goal=InvestmentGoal.GROWTH,
            sector_preferences={'technology': 0.5}
        )

        additional = InvestmentPreferences(
            time_horizon=InvestmentHorizon.LONG_TERM,
            sector_preferences={'healthcare': 0.7}
        )

        merged = engine._merge_preferences(base, additional, 0.6)

        assert merged.primary_goal == InvestmentGoal.GROWTH
        assert merged.time_horizon == InvestmentHorizon.LONG_TERM
        assert merged.sector_preferences['technology'] == 0.2  # 0.5 * (1-0.6)
        assert merged.sector_preferences['healthcare'] == 0.42  # 0.7 * 0.6

    def test_generate_preference_recommendations(self, engine):
        """Test recommendation generation."""
        preferences = InvestmentPreferences(sector_preferences={'technology': 0.8})
        confidence_scores = {'survey': 60, 'portfolio': 80}

        recommendations = engine._generate_preference_recommendations(preferences, confidence_scores)

        assert isinstance(recommendations, list)
        assert len(recommendations) > 0


class TestUserProfilingService:
    """Test main user profiling service."""

    @pytest.fixture
    def service(self):
        """Create user profiling service instance."""
        return UserProfilingService()

    @pytest.mark.asyncio
    async def test_build_user_profile_complete(self, service):
        """Test building complete user profile."""
        kwargs = {
            'questionnaire': {
                'investment_experience': {'years': 5, 'types': ['stocks']},
                'reaction_to_loss': 'hold_and_wait',
                'investment_horizon': '3_5_years',
                'comfort_with_volatility': 6,
                'emergency_fund': True,
                'age': 35
            },
            'trading_history': [
                {'position_size': 0.1, 'entry_date': '2023-01-01T00:00:00Z', 'exit_date': '2023-01-10T00:00:00Z'}
            ],
            'portfolio': {
                'holdings': [
                    {'symbol': 'AAPL', 'value': 10000, 'sector': 'technology', 'weight': 0.5},
                    {'symbol': 'JPM', 'value': 10000, 'sector': 'financial', 'weight': 0.5}
                ]
            },
            'survey_responses': {
                'primary_goal': 'growth',
                'time_horizon': 'medium_term'
            }
        }

        profile = await service.build_user_profile("123", **kwargs)

        assert profile.user_id == "123"
        assert isinstance(profile.risk_tolerance, RiskToleranceAssessment)
        assert isinstance(profile.preferences, InvestmentPreferences)
        assert isinstance(profile.behavioral_profile, BehavioralProfile)
        assert profile.profile_completeness > 0

    @pytest.mark.asyncio
    async def test_build_user_profile_minimal(self, service):
        """Test building minimal user profile."""
        profile = await service.build_user_profile("123")

        assert profile.user_id == "123"
        assert profile.risk_tolerance.level == RiskToleranceLevel.MODERATE
        assert profile.profile_completeness < 50  # Low completeness

    def test_combine_risk_assessments(self, service):
        """Test combining multiple risk assessments."""
        assessments = [
            ('questionnaire', RiskToleranceAssessment(
                overall_score=60.0, level=RiskToleranceLevel.MODERATE,
                volatility_tolerance=60.0, loss_tolerance=60.0, time_recovery=60,
                confidence_level=85.0
            )),
            ('behavioral', RiskToleranceAssessment(
                overall_score=70.0, level=RiskToleranceLevel.MODERATE_AGGRESSIVE,
                volatility_tolerance=70.0, loss_tolerance=70.0, time_recovery=50,
                confidence_level=70.0
            ))
        ]

        combined = service._combine_risk_assessments(assessments)

        assert combined.overall_score > 60  # Weighted average
        assert combined.confidence_level == 80.0

    def test_calculate_profile_completeness(self, service):
        """Test profile completeness calculation."""
        risk_assessments = [('questionnaire', MagicMock()), ('behavioral', MagicMock())]
        preference_analysis = MagicMock()
        preference_analysis.preferences.primary_goal = InvestmentGoal.GROWTH
        preference_analysis.preferences.sector_preferences = {'tech': 0.5}
        preference_analysis.preferences.time_horizon = InvestmentHorizon.MEDIUM_TERM

        completeness = service._calculate_profile_completeness(risk_assessments, preference_analysis)

        assert completeness > 50  # Should have decent completeness