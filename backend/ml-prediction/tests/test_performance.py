"""Performance tests for enhanced recommendation service."""

import pytest
import time
import asyncio
import statistics
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil
import os
from app.main import app


class TestPerformanceMetrics:
    """Performance tests for response times, throughput, and resource usage."""

    @pytest.fixture
    def client(self):
        """FastAPI test client."""
        return TestClient(app)

    @pytest.fixture
    def performance_test_data(self):
        """Test data for performance testing."""
        return {
            "single_request": {
                "user_id": "perf_test_user",
                "symbols": ["AAPL"]
            },
            "batch_request": {
                "user_id": "perf_test_user",
                "symbols": ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"]
            },
            "complex_request": {
                "user_id": "perf_test_user",
                "symbols": ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META", "NFLX"],
                "portfolio_context": {
                    "total_value": 100000,
                    "holdings": [
                        {"symbol": "AAPL", "weight": 0.2, "value": 20000},
                        {"symbol": "MSFT", "weight": 0.15, "value": 15000},
                        {"symbol": "GOOGL", "weight": 0.1, "value": 10000},
                        {"symbol": "BND", "weight": 0.55, "value": 55000}
                    ]
                },
                "include_risk_assessment": True,
                "generate_explanations": True
            }
        }

    @pytest.mark.performance
    def test_single_recommendation_response_time(self, client, performance_test_data):
        """Test response time for single recommendation request."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Setup fast mock response
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Test reason"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Test reason"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            # Measure response time
            start_time = time.time()

            response = client.post(
                "/api/v1/enhanced/personalized/perf_test_user",
                json=performance_test_data["single_request"]
            )

            end_time = time.time()
            response_time = end_time - start_time

            # Assertions
            assert response.status_code == 200
            assert response_time < 2.0  # Should respond within 2 seconds
            assert response_time > 0.001  # Should not be instantaneous (indicates real processing)

    @pytest.mark.performance
    def test_batch_recommendation_response_time(self, client, performance_test_data):
        """Test response time for batch recommendation requests."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Setup batch mock response
            recommendations = []
            for symbol in performance_test_data["batch_request"]["symbols"]:
                mock_rec = AsyncMock()
                mock_rec.symbol = symbol
                mock_rec.signal = "BUY"
                mock_rec.confidence = 0.75
                mock_rec.reasons = ["Batch test reason"]
                mock_rec.model_used = "gpt-4"
                mock_rec.dict = lambda symbol=symbol: {
                    "symbol": symbol,
                    "signal": "BUY",
                    "confidence": 0.75,
                    "reasons": ["Batch test reason"],
                    "model_used": "gpt-4"
                }
                recommendations.append(mock_rec)

            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

            # Measure response time
            start_time = time.time()

            response = client.post(
                "/api/v1/enhanced/personalized/perf_test_user",
                json=performance_test_data["batch_request"]
            )

            end_time = time.time()
            response_time = end_time - start_time

            # Assertions
            assert response.status_code == 200
            assert response_time < 5.0  # Should respond within 5 seconds for batch
            # Batch should not be significantly slower per item than single
            expected_max_time = len(performance_test_data["batch_request"]["symbols"]) * 2.0
            assert response_time < expected_max_time

    @pytest.mark.performance
    def test_complex_recommendation_response_time(self, client, performance_test_data):
        """Test response time for complex recommendation requests."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine, \
             patch('app.api.enhanced_recommendations.risk_assessment_service') as mock_risk, \
             patch('app.api.enhanced_recommendations.llm_orchestrator') as mock_llm:

            # Setup complex mocks
            recommendations = []
            for symbol in performance_test_data["complex_request"]["symbols"]:
                mock_rec = AsyncMock()
                mock_rec.symbol = symbol
                mock_rec.signal = "BUY"
                mock_rec.confidence = 0.8
                mock_rec.reasons = ["Complex analysis reason"]
                mock_rec.model_used = "gpt-4"
                mock_rec.dict = lambda symbol=symbol: {
                    "symbol": symbol,
                    "signal": "BUY",
                    "confidence": 0.8,
                    "reasons": ["Complex analysis reason"],
                    "model_used": "gpt-4"
                }
                recommendations.append(mock_rec)

            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)
            mock_risk.calculate_portfolio_risk = AsyncMock(return_value={"volatility": {"daily": 0.02}})
            mock_llm.generate_recommendation = AsyncMock(return_value={
                "recommendation": {"signal": "BUY", "confidence": 0.8}
            })

            # Measure response time
            start_time = time.time()

            response = client.post(
                "/api/v1/enhanced/personalized/perf_test_user",
                json=performance_test_data["complex_request"]
            )

            end_time = time.time()
            response_time = end_time - start_time

            # Assertions
            assert response.status_code == 200
            assert response_time < 10.0  # Should respond within 10 seconds for complex requests
            assert response_time > 0.1  # Should show real processing time

    @pytest.mark.performance
    def test_concurrent_requests_throughput(self, client, performance_test_data):
        """Test throughput under concurrent load."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Setup mock
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Concurrent test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Concurrent test"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            # Test with multiple concurrent requests
            num_concurrent = 10
            response_times = []

            def make_request(user_id):
                start_time = time.time()
                response = client.post(
                    f"/api/v1/enhanced/personalized/{user_id}",
                    json=performance_test_data["single_request"]
                )
                end_time = time.time()
                return response.status_code, end_time - start_time

            # Execute concurrent requests
            with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
                futures = [
                    executor.submit(make_request, f"user_{i}")
                    for i in range(num_concurrent)
                ]

                for future in as_completed(futures):
                    status_code, response_time = future.result()
                    assert status_code == 200
                    response_times.append(response_time)

            # Performance assertions
            avg_response_time = statistics.mean(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)

            assert avg_response_time < 3.0  # Average should be under 3 seconds
            assert max_response_time < 5.0  # Max should be under 5 seconds
            assert min_response_time > 0.001  # Min should show real processing

            # Throughput calculation (requests per second)
            total_time = max(response_times)  # Time for all requests to complete
            throughput = num_concurrent / total_time
            assert throughput > 2.0  # Should handle at least 2 requests per second

    @pytest.mark.performance
    def test_memory_usage_during_batch_processing(self, client, performance_test_data):
        """Test memory usage during batch processing."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Setup large batch
            large_batch_symbols = [f"SYMBOL_{i}" for i in range(20)]
            recommendations = []

            for symbol in large_batch_symbols:
                mock_rec = AsyncMock()
                mock_rec.symbol = symbol
                mock_rec.signal = "BUY"
                mock_rec.confidence = 0.75
                mock_rec.reasons = ["Memory test reason"]
                mock_rec.model_used = "gpt-4"
                mock_rec.dict = lambda symbol=symbol: {
                    "symbol": symbol,
                    "signal": "BUY",
                    "confidence": 0.75,
                    "reasons": ["Memory test reason"],
                    "model_used": "gpt-4"
                }
                recommendations.append(mock_rec)

            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

            # Monitor memory usage
            process = psutil.Process(os.getpid())
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB

            request_data = {
                "user_id": "perf_test_user",
                "symbols": large_batch_symbols
            }

            response = client.post(
                "/api/v1/enhanced/personalized/perf_test_user",
                json=request_data
            )

            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory

            # Assertions
            assert response.status_code == 200
            assert memory_increase < 100  # Should not increase memory by more than 100MB
            assert final_memory < 500  # Total memory should stay reasonable

    @pytest.mark.performance
    def test_llm_orchestrator_performance(self):
        """Test LLM orchestrator performance under load."""
        with patch('app.core.llm_orchestrator.mcp_server') as mock_mcp:
            from app.core.llm_orchestrator import LLMOrchestrator

            mock_mcp.build_context = AsyncMock(return_value=AsyncMock())

            orchestrator = LLMOrchestrator()

            # Mock LLM adapter
            mock_adapter = AsyncMock()
            mock_adapter.is_available = AsyncMock(return_value=True)
            mock_adapter.generate_response = AsyncMock(return_value=AsyncMock(
                content="Test response",
                model_used="gpt-4",
                confidence_score=0.8,
                generated_at=time.time(),
                tokens_used=100
            ))

            orchestrator.adapters = {
                orchestrator.model_preferences[orchestrator.TaskComplexity.MEDIUM][0]: mock_adapter
            }

            # Test multiple concurrent LLM calls
            async def test_concurrent_llm_calls():
                tasks = []
                for i in range(5):
                    task = orchestrator.generate_recommendation(
                        symbol=f"SYMBOL_{i}",
                        user_id=f"user_{i}"
                    )
                    tasks.append(task)

                start_time = time.time()
                results = await asyncio.gather(*tasks)
                end_time = time.time()

                total_time = end_time - start_time
                avg_time_per_call = total_time / len(tasks)

                return results, total_time, avg_time_per_call

            # Run the test
            results, total_time, avg_time = asyncio.run(test_concurrent_llm_calls())

            # Assertions
            assert len(results) == 5
            assert total_time < 10.0  # Should complete within 10 seconds
            assert avg_time < 3.0  # Average under 3 seconds per call

    @pytest.mark.performance
    def test_database_connection_pooling(self, client):
        """Test database connection pooling under load."""
        # This would test actual database connections in a real scenario
        # For now, we'll test the API endpoint resilience

        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Connection test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Connection test"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            # Rapid succession requests to test connection handling
            response_times = []
            num_requests = 20

            for i in range(num_requests):
                start_time = time.time()
                response = client.post(
                    f"/api/v1/enhanced/personalized/user_{i}",
                    json={"user_id": f"user_{i}", "symbols": ["AAPL"]}
                )
                end_time = time.time()

                assert response.status_code == 200
                response_times.append(end_time - start_time)

            avg_response_time = statistics.mean(response_times)
            success_rate = sum(1 for rt in response_times if rt < 5.0) / len(response_times)

            assert avg_response_time < 2.0
            assert success_rate > 0.95  # 95% of requests should complete within 5 seconds

    @pytest.mark.performance
    def test_error_handling_performance(self, client):
        """Test that error handling doesn't significantly impact performance."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            # Setup engine to fail occasionally
            call_count = 0

            async def intermittent_failure(*args, **kwargs):
                nonlocal call_count
                call_count += 1
                if call_count % 3 == 0:  # Fail every 3rd call
                    raise Exception("Intermittent service failure")
                else:
                    mock_rec = AsyncMock()
                    mock_rec.symbol = "AAPL"
                    mock_rec.signal = "BUY"
                    mock_rec.confidence = 0.8
                    mock_rec.reasons = ["Error handling test"]
                    mock_rec.model_used = "gpt-4"
                    mock_rec.dict = lambda: {
                        "symbol": "AAPL",
                        "signal": "BUY",
                        "confidence": 0.8,
                        "reasons": ["Error handling test"],
                        "model_used": "gpt-4"
                    }
                    return [mock_rec]

            mock_engine.generate_personalized_recommendations = intermittent_failure

            # Test error resilience
            response_times = []
            success_count = 0

            for i in range(9):  # 3 full cycles of success/fail patterns
                start_time = time.time()
                response = client.post(
                    f"/api/v1/enhanced/personalized/user_{i}",
                    json={"user_id": f"user_{i}", "symbols": ["AAPL"]}
                )
                end_time = time.time()

                response_time = end_time - start_time
                response_times.append(response_time)

                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 500:
                    # Error responses should still be fast
                    assert response_time < 1.0

            # Performance should not degrade significantly due to errors
            avg_response_time = statistics.mean(response_times)
            success_rate = success_count / len(response_times)

            assert avg_response_time < 2.0
            assert success_rate > 0.6  # At least 60% success rate with intermittent failures

    @pytest.mark.performance
    def test_scalability_with_increasing_load(self, client):
        """Test how performance scales with increasing load."""
        with patch('app.api.enhanced_recommendations.recommendation_engine') as mock_engine:
            mock_rec = AsyncMock()
            mock_rec.symbol = "AAPL"
            mock_rec.signal = "BUY"
            mock_rec.confidence = 0.8
            mock_rec.reasons = ["Scalability test"]
            mock_rec.model_used = "gpt-4"
            mock_rec.dict = lambda: {
                "symbol": "AAPL",
                "signal": "BUY",
                "confidence": 0.8,
                "reasons": ["Scalability test"],
                "model_used": "gpt-4"
            }
            mock_engine.generate_personalized_recommendations = AsyncMock(return_value=[mock_rec])

            # Test with increasing batch sizes
            batch_sizes = [1, 5, 10, 20]
            performance_results = {}

            for batch_size in batch_sizes:
                symbols = [f"SYMBOL_{i}" for i in range(batch_size)]
                recommendations = []

                for symbol in symbols:
                    mock_rec_batch = AsyncMock()
                    mock_rec_batch.symbol = symbol
                    mock_rec_batch.signal = "BUY"
                    mock_rec_batch.confidence = 0.8
                    mock_rec_batch.reasons = ["Batch scalability test"]
                    mock_rec_batch.model_used = "gpt-4"
                    mock_rec_batch.dict = lambda symbol=symbol: {
                        "symbol": symbol,
                        "signal": "BUY",
                        "confidence": 0.8,
                        "reasons": ["Batch scalability test"],
                        "model_used": "gpt-4"
                    }
                    recommendations.append(mock_rec_batch)

                mock_engine.generate_personalized_recommendations = AsyncMock(return_value=recommendations)

                start_time = time.time()
                response = client.post(
                    "/api/v1/enhanced/personalized/perf_test_user",
                    json={"user_id": "perf_test_user", "symbols": symbols}
                )
                end_time = time.time()

                response_time = end_time - start_time
                performance_results[batch_size] = response_time

                assert response.status_code == 200
                assert response_time < 15.0  # Even large batches should complete

            # Check scaling characteristics
            # Response time should not grow exponentially
            time_ratio_20_to_1 = performance_results[20] / performance_results[1]
            assert time_ratio_20_to_1 < 10.0  # Should scale reasonably