"""Error handling and edge cases tests for enhanced recommendation service."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import json
from app.main import app


class TestErrorHandling:
    """Test error handling across the enhanced recommendation service."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.mark.error_handling
    def test_invalid_user_id_format(self, client):
        """Test handling of invalid user ID formats."""
        invalid_user_ids = ["", "user with spaces", "user@domain.com", "user#123"]

        for invalid_id in invalid_user_ids:
            response = client.post(
                f"/api/v1/enhanced/personalized/{invalid_id}",
                json={"user_id": invalid_id, "symbols": ["AAPL"]}
            )

            # Should handle gracefully - either accept or reject with clear error
            assert response.status_code in [200, 400, 422]

    @pytest.mark.error_handling
    def test_empty_symbol_list(self, client):
        """Test handling of empty symbol lists."""
        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": []}
        )

        # Should reject empty symbol list
        assert response.status_code == 422  # Validation error

    @pytest.mark.error_handling
    def test_too_many_symbols(self, client):
        """Test handling of excessively large symbol lists."""
        too_many_symbols = [f"SYMBOL_{i}" for i in range(101)]  # Over limit

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": too_many_symbols}
        )

        # Should reject or handle gracefully
        assert response.status_code in [200, 400, 422]

    @pytest.mark.error_handling
    def test_invalid_symbol_format(self, client):
        """Test handling of invalid symbol formats."""
        invalid_symbols = ["", "A", "TOOLONGSYMBOLNAME", "123NUMBERFIRST", "SYMBOL@#$%"]

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": invalid_symbols}
        )

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]

    @pytest.mark.error_handling
    def test_duplicate_symbols(self, client):
        """Test handling of duplicate symbols in request."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Duplicate test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Duplicate test"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL", "AAPL", "AAPL"]}
            )

            # Should handle duplicates gracefully
            assert response.status_code == 200
            data = response.json()
            assert len(data["recommendations"]) == 1  # Should deduplicate

    @pytest.mark.error_handling
    def test_service_unavailable_fallback(self, client):
        """Test fallback behavior when primary services are unavailable."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine, \
             patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:

            # Make primary service fail
            mock_engine.generate_personalized_recommendations.side_effect = Exception("Service unavailable")

            # LLM fallback should still work
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": {
                    "signal": "HOLD",
                    "confidence": 0.5,
                    "reasons": ["Fallback recommendation due to service issues"],
                    "technical_insights": "Unable to perform full analysis"
                }
            })

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should still return a response using fallback
            assert response.status_code == 200
            data = response.json()
            assert "recommendations" in data
            assert data["recommendations"][0]["signal"] == "HOLD"

    @pytest.mark.error_handling
    def test_llm_service_timeout(self, client):
        """Test handling of LLM service timeouts."""
        with patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm, \
             patch('asyncio.wait_for') as mock_wait:

            # Simulate timeout
            import asyncio
            mock_wait.side_effect = asyncio.TimeoutError("LLM request timed out")

            response = client.post(
                "/api/v1/enhanced/insights/single",
                json={"symbol": "AAPL", "user_id": "test_user"}
            )

            # Should handle timeout gracefully
            assert response.status_code in [200, 500]
            if response.status_code == 200:
                data = response.json()
                assert "insights" in data

    @pytest.mark.error_handling
    def test_database_connection_failure(self, client):
        """Test handling of database connection failures."""
        with patch('app.api.enhanced_recommendations.user_profiling_service') as mock_profile:
            mock_profile.build_user_profile.side_effect = Exception("Database connection failed")

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should handle DB failure gracefully
            assert response.status_code == 200  # Should still work with defaults
            data = response.json()
            assert "recommendations" in data

    @pytest.mark.error_handling
    def test_external_api_rate_limiting(self, client):
        """Test handling of external API rate limiting."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate rate limiting
            call_count = 0

            async def rate_limited_response(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count > 5:  # Rate limited after 5 calls
                    raise Exception("Rate limit exceeded")
                else:
                    mock_rec = AsyncMock()
                    mock_rec.symbol = "AAPL"
                    mock_rec.signal = "BUY"
                    mock_rec.confidence = 0.8
                    mock_rec.reasons = ["Rate limit test"]
                    mock_rec.model_used = "gpt-4"
                    mock_rec.dict = lambda: {
                        "symbol": "AAPL",
                        "signal": "BUY",
                        "confidence": 0.8,
                        "reasons": ["Rate limit test"],
                        "model_used": "gpt-4"
                    }
                    return [mock_rec]

            mock_engine.generate_personalized_recommendations = rate_limited_response

            # Make multiple rapid requests
            for i in range(7):
                response = client.post(
                    f"/api/v1/enhanced/personalized/user_{i}",
                    json={"user_id": f"user_{i}", "symbols": ["AAPL"]}
                )

                if i < 5:
                    assert response.status_code == 200
                else:
                    # Later requests should handle rate limiting
                    assert response.status_code in [200, 429, 500]

    @pytest.mark.error_handling
    def test_malformed_json_requests(self, client):
        """Test handling of malformed JSON requests."""
        # Missing closing brace
        malformed_json = '{"user_id": "test_user", "symbols": ["AAPL"]'

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            data=malformed_json,
            headers={"Content-Type": "application/json"}
        )

        # Should return 400 Bad Request for malformed JSON
        assert response.status_code == 400

    @pytest.mark.error_handling
    def test_extremely_large_request_payload(self, client):
        """Test handling of extremely large request payloads."""
        # Create a very large payload
        large_symbols = [f"SYMBOL_{i}" for i in range(1000)]
        large_request = {
            "user_id": "test_user",
            "symbols": large_symbols,
            "portfolio_context": {
                "holdings": [
                    {
                        "symbol": sym,
                        "weight": 1.0 / len(large_symbols),
                        "value": 100000 / len(large_symbols),
                        "sector": "technology"
                    } for sym in large_symbols
                ]
            }
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=large_request
        )

        # Should handle large payloads gracefully
        assert response.status_code in [200, 413, 422]  # 413 = Payload Too Large

    @pytest.mark.error_handling
    def test_network_interruptions(self, client):
        """Test handling of network interruptions during processing."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate network interruption
            async def interrupted_call(*args, **kwargs):
                raise Exception("Network connection lost")

            mock_engine.generate_personalized_recommendations = interrupted_call

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should handle network issues gracefully
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data

    @pytest.mark.error_handling
    def test_concurrent_request_conflicts(self, client):
        """Test handling of concurrent requests that might conflict."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate resource conflicts
            call_count = 0

            async def conflicting_call(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count % 2 == 0:  # Every other call conflicts
                    raise Exception("Resource temporarily unavailable")
                else:
                    mock_rec = AsyncMock()
                    mock_rec.symbol = "AAPL"
                    mock_rec.signal = "BUY"
                    mock_rec.confidence = 0.8
                    mock_rec.reasons = ["Conflict test"]
                    mock_rec.model_used = "gpt-4"
                    mock_rec.dict = lambda: {
                        "symbol": "AAPL",
                        "signal": "BUY",
                        "confidence": 0.8,
                        "reasons": ["Conflict test"],
                        "model_used": "gpt-4"
                    }
                    return [mock_rec]

            mock_engine.generate_personalized_recommendations = conflicting_call

            # Make concurrent requests
            responses = []
            for i in range(4):
                response = client.post(
                    f"/api/v1/enhanced/personalized/user_{i}",
                    json={"user_id": f"user_{i}", "symbols": ["AAPL"]}
                )
                responses.append(response)

            # Some should succeed, some should fail but handle gracefully
            success_count = sum(1 for r in responses if r.status_code == 200)
            assert success_count >= 2  # At least half should succeed

    @pytest.mark.error_handling
    def test_invalid_portfolio_data(self, client):
        """Test handling of invalid portfolio data."""
        invalid_portfolio_requests = [
            {
                "user_id": "test_user",
                "symbols": ["AAPL"],
                "portfolio_context": {
                    "holdings": [
                        {"symbol": "AAPL", "weight": 2.0, "value": 10000}  # Weight > 1.0
                    ]
                }
            },
            {
                "user_id": "test_user",
                "symbols": ["AAPL"],
                "portfolio_context": {
                    "holdings": [
                        {"symbol": "AAPL", "weight": -0.1, "value": 10000}  # Negative weight
                    ]
                }
            },
            {
                "user_id": "test_user",
                "symbols": ["AAPL"],
                "portfolio_context": {
                    "holdings": [
                        {"symbol": "AAPL", "weight": 0.5, "value": -5000}  # Negative value
                    ]
                }
            }
        ]

        for invalid_request in invalid_portfolio_requests:
            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json=invalid_request
            )

            # Should handle invalid data gracefully
            assert response.status_code in [200, 400, 422]

    @pytest.mark.error_handling
    def test_missing_market_data(self, client):
        """Test handling when market data is unavailable."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate missing market data
            mock_engine.generate_personalized_recommendations.side_effect = Exception("Market data unavailable")

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["UNKNOWN_SYMBOL"]}
            )

            # Should handle missing data gracefully
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data

    @pytest.mark.error_handling
    def test_user_profile_corruption(self, client):
        """Test handling of corrupted user profile data."""
        with patch('app.api.enhanced_recommendations.user_profiling_service') as mock_profile:
            # Simulate corrupted profile data
            mock_profile.build_user_profile.side_effect = Exception("Profile data corrupted")

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should handle corrupted profile gracefully
            assert response.status_code == 200  # Should fallback to defaults
            data = response.json()
            assert "recommendations" in data

    @pytest.mark.error_handling
    def test_llm_response_parsing_errors(self, client):
        """Test handling of malformed LLM responses."""
        with patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:
            # Simulate malformed LLM response
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": "This is not a properly formatted response"
            })

            response = client.post(
                "/api/v1/enhanced/insights/single",
                json={"symbol": "AAPL", "user_id": "test_user"}
            )

            # Should handle parsing errors gracefully
            assert response.status_code == 200
            data = response.json()
            assert "insights" in data

    @pytest.mark.error_handling
    def test_batch_processing_partial_failures(self, client):
        """Test batch processing when some items fail."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate partial batch failure
            async def partial_failure(*args, **kwargs):
                # Return results for some symbols, fail for others
                return [
                    MagicMock(
                        symbol="AAPL",
                        signal="BUY",
                        confidence=0.8,
                        reasons=["Success"],
                        model_used="gpt-4",
                        dict=lambda: {
                            "symbol": "AAPL",
                            "signal": "BUY",
                            "confidence": 0.8,
                            "reasons": ["Success"],
                            "model_used": "gpt-4"
                        }
                    )
                ]  # Only return one result

            mock_engine.generate_personalized_recommendations = partial_failure

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL", "MSFT", "GOOGL"]}
            )

            # Should handle partial failures gracefully
            assert response.status_code == 200
            data = response.json()
            assert len(data["recommendations"]) >= 1  # At least some results

    @pytest.mark.error_handling
    def test_memory_exhaustion_handling(self, client):
        """Test handling of memory exhaustion scenarios."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate memory exhaustion
            mock_engine.generate_personalized_recommendations.side_effect = MemoryError("Out of memory")

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should handle memory issues gracefully
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data

    @pytest.mark.error_handling
    def test_service_degradation_under_load(self, client):
        """Test service behavior under extreme load conditions."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Simulate service degradation
            call_count = 0

            async def degrading_service(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count > 10:  # Degrade after 10 calls
                    await asyncio.sleep(5)  # Add delay to simulate degradation
                else:
                    await asyncio.sleep(0.1)  # Normal response time

                mock_rec = AsyncMock()
                mock_rec.symbol = "AAPL"
                mock_rec.signal = "BUY"
                mock_rec.confidence = 0.8
                mock_rec.reasons = ["Degradation test"]
                mock_rec.model_used = "gpt-4"
                mock_rec.dict = lambda: {
                    "symbol": "AAPL",
                    "signal": "BUY",
                    "confidence": 0.8,
                    "reasons": ["Degradation test"],
                    "model_used": "gpt-4"
                }
                return [mock_rec]

            mock_engine.generate_personalized_recommendations = degrading_service

            # Make many rapid requests
            import time
            start_time = time.time()

            for i in range(15):
                response = client.post(
                    f"/api/v1/enhanced/personalized/user_{i}",
                    json={"user_id": f"user_{i}", "symbols": ["AAPL"]}
                )
                assert response.status_code in [200, 500]  # Some may timeout/fail

            end_time = time.time()
            total_time = end_time - start_time

            # Service should still be responsive even when degraded
            assert total_time < 30  # Should complete within reasonable time


class TestEdgeCases:
    """Test edge cases in the enhanced recommendation service."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.mark.edge_case
    def test_unicode_symbols_and_text(self, client):
        """Test handling of Unicode symbols and international text."""
        unicode_symbols = ["AAPL", "TSLA", "三星电子"]  # Mix of ASCII and Unicode

        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            recommendations = []
            for symbol in unicode_symbols:
                mock_rec = AsyncMock()
                mock_rec.symbol = symbol
                mock_rec.signal = "BUY"
                mock_rec.confidence = 0.8
                mock_rec.reasons = ["Unicode test - 测试原因"]  # Mix languages
                mock_rec.model_used = "gpt-4"
                mock_rec.dict = lambda symbol=symbol: {
                    "symbol": symbol,
                    "signal": "BUY",
                    "confidence": 0.8,
                    "reasons": ["Unicode test - 测试原因"],
                    "model_used": "gpt-4"
                }
                recommendations.append(mock_rec)

            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": unicode_symbols}
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data["recommendations"]) == len(unicode_symbols)

    @pytest.mark.edge_case
    def test_extremely_small_portfolio_values(self, client):
        """Test handling of extremely small portfolio values."""
        tiny_portfolio = {
            "user_id": "test_user",
            "symbols": ["AAPL"],
            "portfolio_context": {
                "total_value": 0.01,  # Very small portfolio
                "holdings": [
                    {"symbol": "AAPL", "weight": 1.0, "value": 0.01}
                ]
            }
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=tiny_portfolio
        )

        # Should handle tiny portfolios gracefully
        assert response.status_code == 200

    @pytest.mark.edge_case
    def test_extremely_large_portfolio_values(self, client):
        """Test handling of extremely large portfolio values."""
        huge_portfolio = {
            "user_id": "test_user",
            "symbols": ["AAPL"],
            "portfolio_context": {
                "total_value": 1000000000,  # Billion dollar portfolio
                "holdings": [
                    {"symbol": "AAPL", "weight": 1.0, "value": 1000000000}
                ]
            }
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=huge_portfolio
        )

        # Should handle large portfolios gracefully
        assert response.status_code == 200

    @pytest.mark.edge_case
    def test_zero_confidence_scenarios(self, client):
        """Test handling of zero confidence recommendations."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "HOLD"
            mock_rec.confidence = 0.0  # Zero confidence
            mock_rec.reasons = ["Unable to determine clear signal"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "HOLD",
                "confidence": 0.0,
                "reasons": ["Unable to determine clear signal"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["recommendations"][0]["confidence"] == 0.0

    @pytest.mark.edge_case
    def test_maximum_confidence_scenarios(self, client):
        """Test handling of maximum confidence recommendations."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 1.0  # Maximum confidence
            mock_rec.reasons = ["Extremely strong signal"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 1.0,
                "reasons": ["Extremely strong signal"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["recommendations"][0]["confidence"] == 1.0

    @pytest.mark.edge_case
    def test_empty_recommendation_reasons(self, client):
        """Test handling of recommendations with no reasons."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "HOLD"
            mock_rec.confidence = 0.5
            mock_rec.reasons = []  # Empty reasons
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "HOLD",
                "confidence": 0.5,
                "reasons": [],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["recommendations"][0]["reasons"] == []

    @pytest.mark.edge_case
    def test_single_holding_portfolio(self, client):
        """Test portfolios with only a single holding."""
        single_holding_portfolio = {
            "user_id": "test_user",
            "symbols": ["AAPL"],
            "portfolio_context": {
                "total_value": 10000,
                "holdings": [
                    {"symbol": "AAPL", "weight": 1.0, "value": 10000}
                ]
            }
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=single_holding_portfolio
        )

        # Should handle single-holding portfolios
        assert response.status_code == 200

    @pytest.mark.edge_case
    def test_hundred_holding_portfolio(self, client):
        """Test portfolios with many holdings."""
        many_holdings = [
            {"symbol": f"SYMBOL_{i}", "weight": 1.0/100, "value": 1000}
            for i in range(100)
        ]

        large_portfolio = {
            "user_id": "test_user",
            "symbols": ["AAPL"],
            "portfolio_context": {
                "total_value": 100000,
                "holdings": many_holdings
            }
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=large_portfolio
        )

        # Should handle large portfolios
        assert response.status_code == 200

    @pytest.mark.edge_case
    def test_special_characters_in_symbols(self, client):
        """Test symbols with special characters."""
        special_symbols = ["AAPL.O", "BRK.A", "BRK.B", "GE~"]

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": special_symbols}
        )

        # Should handle special characters gracefully
        assert response.status_code in [200, 400, 422]

    @pytest.mark.edge_case
    def test_case_sensitivity_in_symbols(self, client):
        """Test case sensitivity in symbol handling."""
        mixed_case_symbols = ["AAPL", "aapl", "Aapl", "apple"]

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": mixed_case_symbols}
        )

        # Should handle case variations
        assert response.status_code in [200, 400, 422]

    @pytest.mark.edge_case
    def test_very_long_symbol_names(self, client):
        """Test handling of very long symbol names."""
        long_symbol = "A" * 50  # 50 character symbol

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": [long_symbol]}
        )

        # Should handle long symbols
        assert response.status_code in [200, 400, 422]

    @pytest.mark.edge_case
    def test_minimum_request_size(self, client):
        """Test minimum viable request."""
        minimal_request = {
            "user_id": "test",
            "symbols": ["A"]
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test",
            json=minimal_request
        )

        # Should handle minimal requests
        assert response.status_code in [200, 400, 422]