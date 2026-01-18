"""Integration tests for enhanced recommendation service."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import json
from app.main import app
from app.services.personalized_recommendations import recommendation_engine
from app.core.llm_orchestrator import llm_orchestrator
from app.services.user_profiling import user_profiling_service
from app.services.risk_assessment import risk_assessment_service


class TestEnhancedRecommendationsIntegration:
    """Integration tests for enhanced recommendations API."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.fixture
    def mock_services(self):
        """Mock all external service dependencies."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_rec_engine, \
             patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm, \
             patch('app.api.enhanced_recommendations.risk_assessment_service') as mock_risk, \
             patch('app.api.enhanced_recommendations.user_profiling_service') as mock_profile:

            # Setup mock recommendation engine
            mock_rec_engine.generate_personalized_recommendations = AsyncMock(return_value=[
                MagicMock(
                    symbol="AAPL",
                    signal="BUY",
                    confidence=0.85,
                    reasons=["Strong fundamentals", "Positive momentum"],
                    indicators=MagicMock(),
                    model_used="gpt-4",
                    dict=lambda: {
                        "symbol": "AAPL",
                        "signal": "BUY",
                        "confidence": 0.85,
                        "reasons": ["Strong fundamentals", "Positive momentum"],
                        "model_used": "gpt-4"
                    }
                )
            ])

            # Setup mock LLM orchestrator
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": {
                    "signal": "BUY",
                    "confidence": 0.8,
                    "reasons": ["Technical breakout", "Volume surge"],
                    "technical_insights": "Strong upward momentum",
                    "market_context": "Bullish market conditions",
                    "key_insights": ["RSI above 70", "MACD crossover"],
                    "risk_considerations": ["High volatility", "Potential pullback"],
                    "alternative_scenarios": ["Consolidation", "Further upside"]
                }
            })

            # Setup mock risk assessment
            mock_risk.calculate_portfolio_risk = AsyncMock(return_value={
                "volatility": {"daily": 0.015, "annual": 0.24},
                "value_at_risk": {"var_95": -0.035},
                "sharpe_ratio": 0.65
            })

            # Setup mock user profiling
            mock_profile.build_user_profile = AsyncMock(return_value=MagicMock(
                user_id="test_user_123",
                risk_tolerance=MagicMock(level=MagicMock(value="moderate")),
                preferences=MagicMock(primary_goal=MagicMock(value="growth")),
                profile_completeness=85.0
            ))

            yield {
                'recommendation_engine': mock_rec_engine,
                'llm_orchestrator': mock_llm,
                'risk_assessment': mock_risk,
                'user_profiling': mock_profile
            }

    @pytest.mark.asyncio
    async def test_personalized_recommendations_full_flow(self, client, mock_services):
        """Test complete flow of personalized recommendations."""
        request_data = {
            "user_id": "test_user_123",
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "portfolio_context": {
                "total_value": 100000,
                "holdings": [
                    {"symbol": "AAPL", "weight": 0.4, "value": 40000},
                    {"symbol": "MSFT", "weight": 0.3, "value": 30000},
                    {"symbol": "GOOGL", "weight": 0.3, "value": 30000}
                ]
            },
            "risk_tolerance": "moderate",
            "investment_horizon": "medium_term"
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user_123",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == "test_user_123"
        assert "recommendations" in data
        assert "user_profile_summary" in data
        assert "processing_time_seconds" in data
        assert len(data["recommendations"]) > 0

        # Verify service calls
        mock_services['recommendation_engine'].generate_personalized_recommendations.assert_called_once()
        mock_services['user_profiling'].build_user_profile.assert_called()

    @pytest.mark.asyncio
    async def test_risk_assessment_integration(self, client, mock_services):
        """Test risk assessment endpoint integration."""
        request_data = {
            "portfolio": {
                "total_value": 100000,
                "holdings": [
                    {"symbol": "AAPL", "weight": 0.5, "value": 50000, "sector": "technology"},
                    {"symbol": "JPM", "weight": 0.3, "value": 30000, "sector": "financial"},
                    {"symbol": "KO", "weight": 0.2, "value": 20000, "sector": "consumer"}
                ]
            },
            "scenarios": [
                {"name": "Market Crash", "type": "market_wide", "magnitude": 0.2}
            ]
        }

        response = client.post("/api/v1/enhanced/risk/assess", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert "portfolio_risk" in data
        assert "stress_test_results" in data
        assert "recommendations" in data

        # Verify risk service was called
        mock_services['risk_assessment'].calculate_portfolio_risk.assert_called()

    @pytest.mark.asyncio
    async def test_colombian_market_analysis_integration(self, client):
        """Test Colombian market analysis integration."""
        with patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": {
                    "market_trend": "bullish",
                    "key_drivers": ["oil_prices", "interest_rates"],
                    "recommendations": ["Increase energy sector exposure"]
                }
            })

            request_data = {
                "symbols": ["ECOPETROL.CB", "BANCOLOMBIA.CB"],
                "include_trm_analysis": True,
                "include_regulatory_factors": True
            }

            response = client.post("/api/v1/enhanced/colombian-market/analysis", json=request_data)

            assert response.status_code == 200
            data = response.json()

            assert "market_summary" in data
            assert "symbol_analysis" in data
            assert "recommendations" in data

    @pytest.mark.asyncio
    async def test_batch_recommendations_processing(self, client, mock_services):
        """Test batch recommendations processing."""
        request_data = {
            "user_ids": ["user1", "user2", "user3"],
            "symbols": ["AAPL", "MSFT"],
            "recommendation_type": "personalized",
            "priority_users": ["user1"]
        }

        response = client.post("/api/v1/enhanced/batch/recommendations", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert "batch_id" in data
        assert "total_users" in data
        assert "processing_status" in data
        assert data["total_users"] == 3

    @pytest.mark.asyncio
    async def test_llm_fallback_integration(self, client, mock_services):
        """Test LLM fallback mechanism integration."""
        # Setup LLM to fail on first call, succeed on fallback
        call_count = 0

        async def mock_generate_recommendation(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Primary LLM failed")
            return {
                "recommendation": {
                    "signal": "HOLD",
                    "confidence": 0.7,
                    "reasons": ["Fallback recommendation"],
                    "technical_insights": "Stable conditions"
                }
            }

        mock_services['llm_orchestrator'].generate_recommendation = mock_generate_recommendation

        request_data = {
            "symbol": "AAPL",
            "user_id": "test_user",
            "context": {"market_condition": "volatile"}
        }

        response = client.post("/api/v1/enhanced/insights/single", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert "insights" in data
        assert call_count == 2  # Should have tried fallback

    @pytest.mark.asyncio
    async def test_user_profile_enrichment_integration(self, client, mock_services):
        """Test user profile enrichment in recommendations."""
        # Mock user profile with behavioral data
        mock_profile = MagicMock()
        mock_profile.user_id = "test_user_123"
        mock_profile.risk_tolerance.level.value = "conservative"
        mock_profile.behavioral_profile.loss_aversion = 4.5
        mock_profile.preferences.sector_preferences = {"technology": 0.8, "healthcare": 0.6}

        mock_services['user_profiling'].build_user_profile.return_value = mock_profile

        request_data = {
            "user_id": "test_user_123",
            "symbols": ["AAPL"],
            "include_behavioral_adjustments": True
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user_123",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verify profile was used in processing
        assert "user_profile_summary" in data
        assert data["user_profile_summary"]["risk_tolerance"] == "conservative"

    @pytest.mark.asyncio
    async def test_error_handling_integration(self, client, mock_services):
        """Test error handling across integrated services."""
        # Make recommendation engine fail
        mock_services['recommendation_engine'].generate_personalized_recommendations.side_effect = Exception("Service unavailable")

        request_data = {
            "user_id": "test_user_123",
            "symbols": ["AAPL"]
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user_123",
            json=request_data
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Failed to generate recommendations" in data["detail"]

    @pytest.mark.asyncio
    async def test_service_health_check_integration(self, client):
        """Test service health check integration."""
        with patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm, \
             patch('app.api.enhanced_recommendations.risk_assessment_service') as mock_risk:

            mock_llm.health_check = AsyncMock(return_value={
                "overall_status": "healthy",
                "models": {"gpt-4": {"available": True}}
            })

            mock_risk.calculate_portfolio_risk = AsyncMock(return_value={"test": "ok"})

            response = client.get("/api/v1/enhanced/health")

            assert response.status_code == 200
            data = response.json()

            assert "status" in data
            assert "recommendation_engine" in data
            assert "llm_orchestrator" in data
            assert "risk_assessment" in data

    @pytest.mark.asyncio
    async def test_concurrent_request_handling(self, client, mock_services):
        """Test concurrent request handling."""
        import asyncio

        async def make_request(user_id):
            request_data = {
                "user_id": user_id,
                "symbols": ["AAPL"]
            }
            response = client.post(
                f"/api/v1/enhanced/personalized/{user_id}",
                json=request_data
            )
            return response.status_code

        # Make concurrent requests
        tasks = [make_request(f"user_{i}") for i in range(5)]
        results = await asyncio.gather(*tasks)

        # All requests should succeed
        assert all(status == 200 for status in results)

    @pytest.mark.asyncio
    async def test_data_consistency_across_services(self, client, mock_services):
        """Test data consistency across integrated services."""
        # Setup consistent mock data
        user_id = "consistent_test_user"
        symbol = "AAPL"

        # Mock consistent profile data
        mock_profile = MagicMock()
        mock_profile.user_id = user_id
        mock_profile.risk_tolerance.level.value = "moderate"
        mock_profile.preferences.sector_preferences = {"technology": 0.7}

        mock_services['user_profiling'].build_user_profile.return_value = mock_profile

        # Mock consistent recommendation
        mock_recommendation = MagicMock()
        mock_recommendation.symbol = symbol
        mock_recommendation.signal = "BUY"
        mock_recommendation.confidence = 0.8
        mock_recommendation.dict = lambda: {
            "symbol": symbol,
            "signal": "BUY",
            "confidence": 0.8,
            "user_id": user_id
        }

        mock_services['recommendation_engine'].generate_personalized_recommendations.return_value = [mock_recommendation]

        # Make request
        request_data = {"user_id": user_id, "symbols": [symbol]}
        response = client.post(
            f"/api/v1/enhanced/personalized/{user_id}",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verify data consistency
        assert data["user_id"] == user_id
        assert data["recommendations"][0]["symbol"] == symbol
        assert data["user_profile_summary"]["risk_tolerance"] == "moderate"

    @pytest.mark.asyncio
    async def test_cross_service_data_flow(self, client, mock_services):
        """Test data flow between integrated services."""
        # Setup data flow: profile -> risk assessment -> recommendations
        user_id = "data_flow_test"

        # Step 1: Profile data
        mock_profile = MagicMock()
        mock_profile.risk_tolerance.level.value = "aggressive"
        mock_profile.preferences.primary_goal.value = "growth"
        mock_services['user_profiling'].build_user_profile.return_value = mock_profile

        # Step 2: Risk assessment uses profile data
        mock_services['risk_assessment'].calculate_portfolio_risk = AsyncMock(return_value={
            "volatility": {"daily": 0.02, "annual": 0.32},  # Higher for aggressive
            "sharpe_ratio": 0.8
        })

        # Step 3: Recommendations use both profile and risk data
        mock_recommendation = MagicMock()
        mock_recommendation.dict = lambda: {
            "symbol": "TSLA",
            "signal": "BUY",  # Aggressive signal
            "confidence": 0.9,
            "risk_adjusted": True
        }
        mock_services['recommendation_engine'].generate_personalized_recommendations.return_value = [mock_recommendation]

        # Execute integrated flow
        request_data = {
            "user_id": user_id,
            "symbols": ["TSLA"],
            "include_risk_assessment": True
        }

        response = client.post(
            f"/api/v1/enhanced/personalized/{user_id}",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verify data flowed correctly
        assert data["user_profile_summary"]["risk_tolerance"] == "aggressive"
        assert data["recommendations"][0]["signal"] == "BUY"
        assert data["recommendations"][0]["risk_adjusted"] is True