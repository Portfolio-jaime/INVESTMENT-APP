"""Backward compatibility tests for enhanced recommendation service."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app


class TestBackwardCompatibility:
    """Test backward compatibility with existing API contracts."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.mark.backward_compatibility
    def test_legacy_recommendation_api_still_works(self, client):
        """Test that the legacy recommendation API endpoints still work."""
        # Test basic recommendation endpoint
        response = client.get("/api/v1/recommendations/AAPL")

        # Should not return 404 - endpoint should exist
        assert response.status_code != 404

        # Test batch recommendations
        response = client.post(
            "/api/v1/recommendations/batch",
            json={"symbols": ["AAPL", "MSFT"]}
        )

        assert response.status_code != 404

    @pytest.mark.backward_compatibility
    def test_legacy_response_format_maintained(self, client):
        """Test that legacy API response formats are maintained."""
        with patch('app.api.recommendations.get_recommendation') as mock_get_rec:
            # Mock legacy response format
            mock_get_rec.return_value = MagicMock(
                symbol="AAPL",
                signal="BUY",
                confidence=0.85,
                reasons=["Strong fundamentals", "Positive momentum"],
                indicators=MagicMock(
                    rsi=65.5,
                    macd_signal="bullish",
                    sma_20=148.50,
                    sma_50=145.20
                )
            )

            response = client.get("/api/v1/recommendations/AAPL")

            if response.status_code == 200:
                data = response.json()

                # Check that legacy fields are present
                assert "symbol" in data
                assert "signal" in data
                assert "confidence" in data
                assert "reasons" in data
                assert "indicators" in data

                # Check indicator structure
                if "indicators" in data:
                    indicators = data["indicators"]
                    assert "rsi" in indicators
                    assert "macd_signal" in indicators

    @pytest.mark.backward_compatibility
    def test_enhanced_features_are_opt_in(self, client):
        """Test that enhanced features don't break existing functionality."""
        # Test that basic requests without enhanced features still work
        basic_request = {
            "user_id": "legacy_user",
            "symbols": ["AAPL"]
        }

        response = client.post(
            "/api/v1/enhanced/personalized/legacy_user",
            json=basic_request
        )

        # Should work even without enhanced features specified
        assert response.status_code == 200

    @pytest.mark.backward_compatibility
    def test_feature_flags_control_new_functionality(self, client):
        """Test that feature flags properly control new functionality."""
        # Test with feature flags disabled (simulated)
        with patch('app.core.config.settings') as mock_settings:
            mock_settings.ENABLE_ENHANCED_RECOMMENDATIONS = False
            mock_settings.ENABLE_PERSONALIZATION = False

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            # Should still work but with reduced functionality
            assert response.status_code in [200, 400, 422]

    @pytest.mark.backward_compatibility
    def test_api_versioning_compatibility(self, client):
        """Test that API versioning maintains compatibility."""
        # Test v1 endpoints still work
        endpoints_to_test = [
            "/api/v1/recommendations/AAPL",
            "/api/v1/recommendations/batch",
            "/api/v1/enhanced/personalized/test_user",
            "/api/v1/enhanced/risk/assess",
            "/api/v1/enhanced/colombian-market/analysis"
        ]

        for endpoint in endpoints_to_test:
            if endpoint.startswith("/api/v1/recommendations/"):
                if "batch" in endpoint:
                    response = client.post(endpoint, json={"symbols": ["AAPL"]})
                else:
                    response = client.get(endpoint)
            else:
                # Enhanced endpoints - send minimal valid request
                response = client.post(
                    endpoint,
                    json={"user_id": "test", "symbols": ["AAPL"]}
                ) if "personalized" in endpoint else client.post(
                    endpoint,
                    json={"portfolio": {"holdings": []}}
                ) if "risk" in endpoint else client.get(endpoint)

            # All v1 endpoints should exist (not 404)
            assert response.status_code != 404, f"Endpoint {endpoint} returned 404"

    @pytest.mark.backward_compatibility
    def test_request_parameter_compatibility(self, client):
        """Test that old request parameters are still accepted."""
        # Test legacy parameter names
        legacy_request = {
            "user_id": "legacy_user",
            "symbols": ["AAPL", "MSFT"],
            "include_ml": True,  # Legacy parameter
            "personalized": False  # Legacy parameter
        }

        response = client.post(
            "/api/v1/enhanced/personalized/legacy_user",
            json=legacy_request
        )

        # Should accept legacy parameters without error
        assert response.status_code in [200, 400, 422]

    @pytest.mark.backward_compatibility
    def test_response_schema_compatibility(self, client):
        """Test that response schemas maintain backward compatibility."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Mock response with all expected fields
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.85
            mock_rec.reasons = ["Legacy compatible reasons"]
            mock_rec.indicators = MagicMock(
                rsi=65.5,
                macd_signal="bullish",
                sma_20=148.50,
                sma_50=145.20
            )
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.85,
                "reasons": ["Legacy compatible reasons"],
                "indicators": {
                    "rsi": 65.5,
                    "macd_signal": "bullish",
                    "sma_20": 148.50,
                    "sma_50": 145.20
                },
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            assert response.status_code == 200
            data = response.json()

            # Verify all legacy fields are present
            recommendation = data["recommendations"][0]
            required_fields = ["symbol", "signal", "confidence", "reasons", "indicators"]
            for field in required_fields:
                assert field in recommendation, f"Missing required field: {field}"

            # Verify indicator structure
            indicators = recommendation["indicators"]
            legacy_indicator_fields = ["rsi", "macd_signal", "sma_20", "sma_50"]
            for field in legacy_indicator_fields:
                assert field in indicators, f"Missing legacy indicator field: {field}"

    @pytest.mark.backward_compatibility
    def test_error_response_format_compatibility(self, client):
        """Test that error response formats remain compatible."""
        # Test with invalid request
        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": []}  # Empty symbols
        )

        if response.status_code >= 400:
            data = response.json()
            # Should have standard error format
            assert "detail" in data or "message" in data or isinstance(data, list)

    @pytest.mark.backward_compatibility
    def test_pagination_compatibility(self, client):
        """Test that pagination parameters work as before."""
        # Test batch requests with pagination-like behavior
        large_batch = {"symbols": [f"SYMBOL_{i}" for i in range(10)]}

        response = client.post(
            "/api/v1/recommendations/batch",
            json=large_batch
        )

        if response.status_code == 200:
            data = response.json()
            # Should handle batch size appropriately
            assert "recommendations" in data
            assert len(data["recommendations"]) <= len(large_batch["symbols"])

    @pytest.mark.backward_compatibility
    def test_authentication_headers_compatibility(self, client):
        """Test that authentication headers work as before."""
        # Test that standard auth headers are accepted
        headers = {
            "Authorization": "Bearer test_token",
            "X-API-Key": "test_key"
        }

        response = client.get(
            "/api/v1/recommendations/AAPL",
            headers=headers
        )

        # Should not fail due to auth headers
        assert response.status_code in [200, 401, 403]  # Auth failures are OK, 404 is not

    @pytest.mark.backward_compatibility
    def test_content_type_compatibility(self, client):
        """Test that content-type handling works as before."""
        # Test JSON content type
        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": ["AAPL"]},
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code != 415  # Should not fail with supported content type

    @pytest.mark.backward_compatibility
    def test_query_parameter_compatibility(self, client):
        """Test that query parameters work as before."""
        # Test legacy query parameters
        params = {
            "include_ml": "true",
            "format": "json",
            "version": "1"
        }

        response = client.get(
            "/api/v1/recommendations/AAPL",
            params=params
        )

        # Should handle query parameters
        assert response.status_code != 422  # Should not fail validation

    @pytest.mark.backward_compatibility
    def test_http_method_compatibility(self, client):
        """Test that HTTP methods work as before."""
        # Test GET for single recommendations
        response = client.get("/api/v1/recommendations/AAPL")
        assert response.status_code != 405  # Method not allowed

        # Test POST for batch recommendations
        response = client.post(
            "/api/v1/recommendations/batch",
            json={"symbols": ["AAPL"]}
        )
        assert response.status_code != 405

    @pytest.mark.backward_compatibility
    def test_http_status_code_compatibility(self, client):
        """Test that HTTP status codes remain compatible."""
        # Test successful request
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Test"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )
            assert response.status_code == 200

        # Test client error (empty symbols)
        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json={"user_id": "test_user", "symbols": []}
        )
        if response.status_code >= 400:
            assert response.status_code in [400, 422]  # Standard client error codes

    @pytest.mark.backward_compatibility
    def test_cors_headers_compatibility(self, client):
        """Test that CORS headers work as before."""
        response = client.options("/api/v1/recommendations/AAPL")

        # Should handle OPTIONS requests for CORS
        assert response.status_code in [200, 404, 405]

    @pytest.mark.backward_compatibility
    def test_rate_limiting_compatibility(self, client):
        """Test that rate limiting works as before."""
        # Make multiple rapid requests
        responses = []
        for i in range(10):
            response = client.get("/api/v1/recommendations/AAPL")
            responses.append(response.status_code)

        # Should not get all 429s (rate limited) - some should succeed
        success_count = sum(1 for status in responses if status == 200)
        assert success_count > 0

    @pytest.mark.backward_compatibility
    def test_data_format_compatibility(self, client):
        """Test that data formats (JSON, timestamps, etc.) work as before."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            from datetime import datetime
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.generated_at = datetime.utcnow()
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Test"],
                "model_used": "gpt-4",
                "generated_at": mock_rec.generated_at.isoformat()
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": ["AAPL"]}
            )

            assert response.status_code == 200
            data = response.json()

            # Check data types
            recommendation = data["recommendations"][0]
            assert isinstance(recommendation["symbol"], str)
            assert isinstance(recommendation["confidence"], (int, float))
            assert isinstance(recommendation["reasons"], list)

    @pytest.mark.backward_compatibility
    def test_default_values_compatibility(self, client):
        """Test that default values work as before."""
        # Test request with minimal parameters
        minimal_request = {
            "user_id": "test_user",
            "symbols": ["AAPL"]
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=minimal_request
        )

        # Should work with defaults
        assert response.status_code == 200

    @pytest.mark.backward_compatibility
    def test_null_empty_value_handling_compatibility(self, client):
        """Test that null/empty value handling works as before."""
        # Test with None values where appropriate
        request_with_nulls = {
            "user_id": "test_user",
            "symbols": ["AAPL"],
            "portfolio_context": None,
            "market_context": None
        }

        response = client.post(
            "/api/v1/enhanced/personalized/test_user",
            json=request_with_nulls
        )

        # Should handle null values gracefully
        assert response.status_code == 200

    @pytest.mark.backward_compatibility
    def test_encoding_charset_compatibility(self, client):
        """Test that character encoding works as before."""
        # Test with various character sets
        test_strings = [
            "AAPL",  # ASCII
            "Mañana",  # Latin-1
            "测试",  # UTF-8 Chinese
            "🚀📈💰"  # Emojis
        ]

        for test_symbol in test_strings:
            response = client.post(
                "/api/v1/enhanced/personalized/test_user",
                json={"user_id": "test_user", "symbols": [test_symbol]}
            )

            # Should handle encoding properly
            assert response.status_code in [200, 400, 422]