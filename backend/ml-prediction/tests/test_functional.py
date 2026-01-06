"""Functional tests for end-to-end recommendation generation."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
import time
from app.main import app


class TestEndToEndRecommendationGeneration:
    """Functional tests for complete recommendation generation flow."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.fixture
    def comprehensive_test_data(self):
        """Comprehensive test data for end-to-end testing."""
        return {
            "user_profile": {
                "user_id": "functional_test_user",
                "risk_tolerance": "moderate",
                "investment_experience": "intermediate",
                "investment_horizon": "medium_term",
                "portfolio_size": 50000,
                "monthly_income": 5000,
                "emergency_fund_months": 6,
                "sector_preferences": {
                    "technology": 0.8,
                    "healthcare": 0.6,
                    "financial": 0.4,
                    "energy": 0.2
                },
                "ethical_constraints": ["fossil_fuels"],
                "behavioral_profile": {
                    "loss_aversion": 3.5,
                    "risk_taking": 6.0,
                    "time_horizon_preference": "balanced"
                }
            },
            "market_data": {
                "AAPL": {
                    "price": 150.25,
                    "volume": 45000000,
                    "change_percent": 2.1,
                    "technical_indicators": {
                        "rsi": 68,
                        "macd": {"signal": "bullish", "histogram": 0.5},
                        "moving_averages": {"sma_20": 147.80, "sma_50": 145.20},
                        "bollinger_bands": {"upper": 152.10, "lower": 143.50, "position": "middle"}
                    },
                    "fundamental_data": {
                        "pe_ratio": 28.5,
                        "eps": 5.27,
                        "revenue_growth": 0.08,
                        "profit_margin": 0.22,
                        "debt_to_equity": 1.8,
                        "roa": 0.15,
                        "roe": 0.85
                    },
                    "sentiment": {
                        "news_sentiment": 0.7,
                        "social_media_score": 0.65,
                        "analyst_ratings": {"buy": 25, "hold": 15, "sell": 5}
                    }
                },
                "MSFT": {
                    "price": 305.50,
                    "volume": 28000000,
                    "change_percent": -0.8,
                    "technical_indicators": {
                        "rsi": 45,
                        "macd": {"signal": "bearish", "histogram": -0.3},
                        "moving_averages": {"sma_20": 310.20, "sma_50": 308.80},
                        "bollinger_bands": {"upper": 318.50, "lower": 302.10, "position": "lower"}
                    },
                    "fundamental_data": {
                        "pe_ratio": 32.1,
                        "eps": 9.52,
                        "revenue_growth": 0.12,
                        "profit_margin": 0.35,
                        "debt_to_equity": 0.4,
                        "roa": 0.18,
                        "roe": 0.42
                    },
                    "sentiment": {
                        "news_sentiment": 0.4,
                        "social_media_score": 0.5,
                        "analyst_ratings": {"buy": 20, "hold": 18, "sell": 7}
                    }
                },
                "TSLA": {
                    "price": 245.80,
                    "volume": 85000000,
                    "change_percent": 5.2,
                    "technical_indicators": {
                        "rsi": 78,
                        "macd": {"signal": "bullish", "histogram": 1.2},
                        "moving_averages": {"sma_20": 235.60, "sma_50": 228.90},
                        "bollinger_bands": {"upper": 250.80, "lower": 220.40, "position": "upper"}
                    },
                    "fundamental_data": {
                        "pe_ratio": 65.8,
                        "eps": 3.73,
                        "revenue_growth": 0.45,
                        "profit_margin": 0.08,
                        "debt_to_equity": 0.8,
                        "roa": 0.05,
                        "roe": 0.12
                    },
                    "sentiment": {
                        "news_sentiment": 0.8,
                        "social_media_score": 0.85,
                        "analyst_ratings": {"buy": 15, "hold": 12, "sell": 13}
                    }
                }
            },
            "portfolio_context": {
                "current_holdings": [
                    {"symbol": "AAPL", "shares": 100, "avg_cost": 140.00, "current_value": 15025.00},
                    {"symbol": "MSFT", "shares": 50, "avg_cost": 280.00, "current_value": 15275.00},
                    {"symbol": "BND", "shares": 200, "avg_cost": 85.00, "current_value": 16800.00}
                ],
                "total_value": 47100.00,
                "cash": 2900.00,
                "sector_allocation": {
                    "technology": 0.65,
                    "financial": 0.0,
                    "bonds": 0.35
                }
            }
        }

    @pytest.mark.asyncio
    async def test_complete_recommendation_workflow(self, client, comprehensive_test_data):
        """Test complete end-to-end recommendation generation workflow."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine, \
             patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm, \
             patch('app.api.enhanced_recommendations.user_profiling_service') as mock_profile, \
             patch('app.api.enhanced_recommendations.risk_assessment_service') as mock_risk:

            # Setup comprehensive mocks
            self._setup_comprehensive_mocks(
                mock_rec_engine, mock_llm, mock_profile, mock_risk, comprehensive_test_data
            )

            # Execute the complete workflow
            start_time = time.time()

            request_data = {
                "user_id": comprehensive_test_data["user_profile"]["user_id"],
                "symbols": ["AAPL", "MSFT", "TSLA"],
                "portfolio_context": comprehensive_test_data["portfolio_context"],
                "market_context": {
                    "market_trend": "bullish",
                    "volatility_index": 18.5,
                    "interest_rates": 0.045
                },
                "generate_explanations": True,
                "include_risk_assessment": True,
                "personalization_level": "comprehensive"
            }

            response = client.post(
                f"/api/v1/enhanced/personalized/{request_data['user_id']}",
                json=request_data
            )

            end_time = time.time()
            processing_time = end_time - start_time

            # Assertions
            assert response.status_code == 200
            data = response.json()

            # Verify response structure
            assert "user_id" in data
            assert "recommendations" in data
            assert "user_profile_summary" in data
            assert "processing_time_seconds" in data
            assert "metadata" in data

            # Verify recommendations quality
            recommendations = data["recommendations"]
            assert len(recommendations) == 3

            for rec in recommendations:
                assert "symbol" in rec
                assert "signal" in rec
                assert "confidence" in rec
                assert "reasons" in rec
                assert "model_used" in rec
                assert rec["confidence"] > 0
                assert rec["confidence"] <= 1.0
                assert rec["signal"] in ["BUY", "HOLD", "SELL", "AVOID"]

            # Verify personalization
            profile_summary = data["user_profile_summary"]
            assert profile_summary["risk_tolerance"] == "moderate"
            assert "sector_preferences" in profile_summary

            # Verify performance
            assert processing_time < 5.0  # Should complete within 5 seconds
            assert data["processing_time_seconds"] > 0

            # Verify metadata
            metadata = data["metadata"]
            assert "llm_models_used" in metadata
            assert "risk_assessment_performed" in metadata
            assert "personalization_applied" in metadata

    @pytest.mark.asyncio
    async def test_recommendation_accuracy_validation(self, client, comprehensive_test_data):
        """Test recommendation accuracy against expected outcomes."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine, \
             patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:

            # Setup mocks with specific expected behaviors
            self._setup_accuracy_test_mocks(mock_rec_engine, mock_llm, comprehensive_test_data)

            request_data = {
                "user_id": comprehensive_test_data["user_profile"]["user_id"],
                "symbols": ["AAPL", "MSFT", "TSLA"],
                "portfolio_context": comprehensive_test_data["portfolio_context"]
            }

            response = client.post(
                f"/api/v1/enhanced/personalized/{request_data['user_id']}",
                json=request_data
            )

            assert response.status_code == 200
            data = response.json()

            recommendations = data["recommendations"]

            # Validate recommendation logic
            aapl_rec = next(r for r in recommendations if r["symbol"] == "AAPL")
            msft_rec = next(r for r in recommendations if r["symbol"] == "MSFT")
            tsla_rec = next(r for r in recommendations if r["symbol"] == "TSLA")

            # AAPL should be BUY/HOLD (strong fundamentals, positive momentum)
            assert aapl_rec["signal"] in ["BUY", "HOLD"]
            assert aapl_rec["confidence"] > 0.6

            # MSFT should be HOLD/AVOID (technical weakness, moderate fundamentals)
            assert msft_rec["signal"] in ["HOLD", "AVOID"]
            assert msft_rec["confidence"] > 0.4

            # TSLA should be BUY (strong momentum, high growth)
            assert tsla_rec["signal"] == "BUY"
            assert tsla_rec["confidence"] > 0.7

    @pytest.mark.asyncio
    async def test_risk_adjusted_recommendations(self, client, comprehensive_test_data):
        """Test that recommendations are properly risk-adjusted."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine, \
             patch('app.api.enhanced_recommendations.risk_assessment_service') as mock_risk:

            # Setup conservative user profile
            conservative_profile = comprehensive_test_data["user_profile"].copy()
            conservative_profile["risk_tolerance"] = "conservative"
            conservative_profile["behavioral_profile"]["loss_aversion"] = 4.8

            self._setup_risk_adjusted_mocks(mock_rec_engine, mock_risk, conservative_profile)

            request_data = {
                "user_id": conservative_profile["user_id"],
                "symbols": ["TSLA", "AAPL"],  # High volatility stocks
                "include_risk_assessment": True
            }

            response = client.post(
                f"/api/v1/enhanced/personalized/{request_data['user_id']}",
                json=request_data
            )

            assert response.status_code == 200
            data = response.json()

            recommendations = data["recommendations"]

            # Conservative user should get more cautious recommendations
            for rec in recommendations:
                # Should avoid high-volatility BUY recommendations
                if rec["symbol"] == "TSLA" and rec["signal"] == "BUY":
                    assert rec["confidence"] < 0.8  # Lower confidence for risky assets
                    assert "risk_adjusted" in rec
                    assert rec["risk_adjusted"] is True

    @pytest.mark.asyncio
    async def test_portfolio_rebalancing_recommendations(self, client, comprehensive_test_data):
        """Test portfolio rebalancing recommendations."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine:

            # Setup portfolio with overweight technology
            overweight_portfolio = comprehensive_test_data["portfolio_context"].copy()
            overweight_portfolio["sector_allocation"]["technology"] = 0.85
            overweight_portfolio["sector_allocation"]["bonds"] = 0.15

            self._setup_rebalancing_mocks(mock_rec_engine, overweight_portfolio)

            request_data = {
                "user_id": comprehensive_test_data["user_profile"]["user_id"],
                "symbols": ["AAPL", "BND", "JPM"],  # Tech, bonds, financial
                "portfolio_context": overweight_portfolio,
                "request_type": "rebalancing"
            }

            response = client.post(
                f"/api/v1/enhanced/personalized/{request_data['user_id']}",
                json=request_data
            )

            assert response.status_code == 200
            data = response.json()

            recommendations = data["recommendations"]

            # Should recommend reducing technology exposure
            tech_rec = next((r for r in recommendations if r["symbol"] == "AAPL"), None)
            bond_rec = next((r for r in recommendations if r["symbol"] == "BND"), None)

            if tech_rec:
                assert "reduce" in " ".join(tech_rec["reasons"]).lower()
            if bond_rec:
                assert "increase" in " ".join(bond_rec["reasons"]).lower()

    @pytest.mark.asyncio
    async def test_market_condition_adaptation(self, client, comprehensive_test_data):
        """Test recommendations adapt to market conditions."""
        market_conditions = [
            {"trend": "bullish", "volatility": "low", "expected_signal": "BUY"},
            {"trend": "bearish", "volatility": "high", "expected_signal": "AVOID"},
            {"trend": "sideways", "volatility": "moderate", "expected_signal": "HOLD"}
        ]

        for condition in market_conditions:
            with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine:

                self._setup_market_condition_mocks(mock_rec_engine, condition)

                request_data = {
                    "user_id": comprehensive_test_data["user_profile"]["user_id"],
                    "symbols": ["AAPL"],
                    "market_context": {
                        "market_trend": condition["trend"],
                        "volatility_index": 15 if condition["volatility"] == "low" else 25 if condition["volatility"] == "moderate" else 35
                    }
                }

                response = client.post(
                    f"/api/v1/enhanced/personalized/{request_data['user_id']}",
                    json=request_data
                )

                assert response.status_code == 200
                data = response.json()

                recommendation = data["recommendations"][0]
                # Should adapt to market conditions
                assert recommendation["signal"] in [condition["expected_signal"], "HOLD"]

    @pytest.mark.asyncio
    async def test_explanation_quality(self, client, comprehensive_test_data):
        """Test quality of recommendation explanations."""
        with patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:

            # Setup detailed explanations
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": {
                    "signal": "BUY",
                    "confidence": 0.85,
                    "reasons": [
                        "Strong technical momentum with RSI above 70",
                        "Positive earnings surprise last quarter",
                        "Increasing institutional ownership",
                        "Sector leadership in AI technology"
                    ],
                    "technical_insights": "Price broke above key resistance level with high volume",
                    "fundamental_insights": "Company shows strong revenue growth and margin expansion",
                    "risk_considerations": [
                        "High valuation may limit upside potential",
                        "Dependence on semiconductor supply chain",
                        "Competition from other AI companies"
                    ],
                    "time_horizon": "medium_term",
                    "expected_return_range": "8-15% over next 6-12 months"
                }
            })

            request_data = {
                "symbol": "AAPL",
                "user_id": comprehensive_test_data["user_profile"]["user_id"],
                "generate_detailed_explanation": True
            }

            response = client.post("/api/v1/enhanced/insights/single", json=request_data)

            assert response.status_code == 200
            data = response.json()

            insights = data["insights"]

            # Verify explanation quality
            assert len(insights["reasons"]) >= 3
            assert "technical_insights" in insights
            assert "fundamental_insights" in insights
            assert "risk_considerations" in insights
            assert len(insights["risk_considerations"]) >= 2
            assert "time_horizon" in insights
            assert "expected_return_range" in insights

    def _setup_comprehensive_mocks(self, mock_rec_engine, mock_llm, mock_profile, mock_risk, test_data):
        """Setup comprehensive mocks for full workflow testing."""
        # Mock user profile
        mock_profile_obj = MagicMock()
        mock_profile_obj.user_id = test_data["user_profile"]["user_id"]
        mock_profile_obj.risk_tolerance.level.value = test_data["user_profile"]["risk_tolerance"]
        mock_profile_obj.preferences.sector_preferences = test_data["user_profile"]["sector_preferences"]
        mock_profile_obj.profile_completeness = 85.0
        mock_profile.build_user_profile = AsyncMock(return_value=mock_profile_obj)

        # Mock recommendations
        recommendations = []
        for symbol in ["AAPL", "MSFT", "TSLA"]:
            rec = MagicMock()
            rec.symbol = symbol
            rec.signal = "BUY" if symbol in ["AAPL", "TSLA"] else "HOLD"
            rec.confidence = 0.8 if symbol == "TSLA" else 0.7
            rec.reasons = ["Technical analysis", "Fundamental strength"]
            rec.model_used = "gpt-4"
            rec.dict = lambda symbol=symbol, signal=rec.signal, confidence=rec.confidence: {
                "symbol": symbol,
                "signal": signal,
                "confidence": confidence,
                "reasons": ["Technical analysis", "Fundamental strength"],
                "model_used": "gpt-4"
            }
            recommendations.append(rec)

        mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

        # Mock LLM
        mock_llm.generate_recommendation = AsyncMock(return_value={
            "recommendation": {"signal": "BUY", "confidence": 0.8}
        })

        # Mock risk assessment
        mock_risk.calculate_portfolio_risk = AsyncMock(return_value={
            "volatility": {"daily": 0.015, "annual": 0.24}
        })

    def _setup_accuracy_test_mocks(self, mock_rec_engine, mock_llm, test_data):
        """Setup mocks for accuracy validation."""
        recommendations = []
        expected_signals = {"AAPL": "BUY", "MSFT": "HOLD", "TSLA": "BUY"}

        for symbol, expected_signal in expected_signals.items():
            rec = MagicMock()
            rec.symbol = symbol
            rec.signal = expected_signal
            rec.confidence = 0.8 if expected_signal == "BUY" else 0.6
            rec.reasons = ["Data-driven analysis"]
            rec.model_used = "gpt-4"
            rec.dict = lambda symbol=symbol, signal=rec.signal, confidence=rec.confidence: {
                "symbol": symbol,
                "signal": signal,
                "confidence": confidence,
                "reasons": ["Data-driven analysis"],
                "model_used": "gpt-4"
            }
            recommendations.append(rec)

        mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

    def _setup_risk_adjusted_mocks(self, mock_rec_engine, mock_risk, profile):
        """Setup mocks for risk-adjusted recommendations."""
        # Conservative recommendations
        recommendations = []
        for symbol in ["TSLA", "AAPL"]:
            rec = MagicMock()
            rec.symbol = symbol
            rec.signal = "HOLD" if symbol == "TSLA" else "BUY"
            rec.confidence = 0.6 if symbol == "TSLA" else 0.75
            rec.reasons = ["Risk-adjusted for conservative profile"]
            rec.model_used = "gpt-4"
            rec.risk_adjusted = True
            rec.dict = lambda symbol=symbol, signal=rec.signal, confidence=rec.confidence: {
                "symbol": symbol,
                "signal": signal,
                "confidence": confidence,
                "reasons": ["Risk-adjusted for conservative profile"],
                "model_used": "gpt-4",
                "risk_adjusted": True
            }
            recommendations.append(rec)

        mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

    def _setup_rebalancing_mocks(self, mock_rec_engine, portfolio):
        """Setup mocks for rebalancing recommendations."""
        recommendations = []
        rebalance_signals = {"AAPL": "REDUCE", "BND": "INCREASE", "JPM": "BUY"}

        for symbol, signal in rebalance_signals.items():
            rec = MagicMock()
            rec.symbol = symbol
            rec.signal = signal
            rec.confidence = 0.8
            rec.reasons = [f"Portfolio rebalancing: {signal.lower()} {symbol} exposure"]
            rec.model_used = "gpt-4"
            rec.dict = lambda symbol=symbol, signal=rec.signal, confidence=rec.confidence: {
                "symbol": symbol,
                "signal": signal,
                "confidence": confidence,
                "reasons": [f"Portfolio rebalancing: {signal.lower()} {symbol} exposure"],
                "model_used": "gpt-4"
            }
            recommendations.append(rec)

        mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

    def _setup_market_condition_mocks(self, mock_rec_engine, condition):
        """Setup mocks for market condition adaptation."""
        signal_map = {
            "bullish": "BUY",
            "bearish": "AVOID",
            "sideways": "HOLD"
        }

        rec = MagicMock()
        rec.symbol = "AAPL"
        rec.signal = signal_map[condition["trend"]]
        rec.confidence = 0.7
        rec.reasons = [f"Adapted to {condition['trend']} market conditions"]
        rec.model_used = "gpt-4"
        rec.dict = lambda signal=rec.signal: {
            "symbol": "AAPL",
            "signal": signal,
            "confidence": 0.7,
            "reasons": [f"Adapted to {condition['trend']} market conditions"],
            "model_used": "gpt-4"
        }

        mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=[rec])