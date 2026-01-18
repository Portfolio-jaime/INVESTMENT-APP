"""Unit tests for hybrid LLM orchestrator."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.core.llm_orchestrator import (
    LLMOrchestrator,
    LLMModel,
    TaskComplexity,
    TaskComplexity
)
from app.mcp.context import MCPRequest, MCPResponse
from datetime import datetime


class TestLLMOrchestrator:
    """Test LLM orchestrator functionality."""

    @pytest.fixture
    def orchestrator(self):
        """Create LLM orchestrator instance."""
        return LLMOrchestrator()

    @pytest.fixture
    def mock_adapter(self):
        """Mock LLM adapter."""
        adapter = AsyncMock()
        adapter.is_available = AsyncMock(return_value=True)
        adapter.generate_response = AsyncMock(return_value=MCPResponse(
            content="Test response",
            model_used="test-model",
            confidence_score=0.8,
            generated_at=datetime.utcnow(),
            tokens_used=100
        ))
        adapter.provider = "test_provider"
        return adapter

    @pytest.fixture
    def mock_mcp_server(self):
        """Mock MCP server."""
        with patch('app.core.llm_orchestrator.mcp_server') as mock_server:
            mock_server.build_context = AsyncMock(return_value=MagicMock())
            mock_server.register_adapter = MagicMock()
            mock_server.get_available_models = AsyncMock(return_value=[])
            yield mock_server

    def test_initialization(self, orchestrator):
        """Test orchestrator initialization."""
        assert orchestrator.adapters == {}
        assert isinstance(orchestrator.model_preferences, dict)
        assert isinstance(orchestrator.fallback_chain, list)

    def test_model_preferences(self, orchestrator):
        """Test model preferences configuration."""
        prefs = orchestrator.model_preferences

        assert TaskComplexity.CRITICAL in prefs
        assert TaskComplexity.HIGH in prefs
        assert TaskComplexity.MEDIUM in prefs
        assert TaskComplexity.LOW in prefs

        # Critical tasks should prefer GPT-4
        critical_prefs = prefs[TaskComplexity.CRITICAL]
        assert LLMModel.OPENAI_GPT4 in critical_prefs

    def test_fallback_chain(self, orchestrator):
        """Test fallback chain configuration."""
        chain = orchestrator.fallback_chain

        assert LLMModel.OPENAI_GPT4 in chain
        assert len(chain) > 0
        # GPT-4 should be first in fallback
        assert chain[0] == LLMModel.OPENAI_GPT4

    def test_register_openai_adapter(self, orchestrator, mock_mcp_server):
        """Test registering OpenAI adapter."""
        orchestrator.register_openai_adapter("test-key")

        assert LLMModel.OPENAI_GPT4 in orchestrator.adapters
        assert LLMModel.OPENAI_GPT35 in orchestrator.adapters
        mock_mcp_server.register_adapter.assert_called()

    def test_register_ollama_adapter(self, orchestrator, mock_mcp_server):
        """Test registering Ollama adapter."""
        orchestrator.register_ollama_adapter("http://localhost:11434")

        # Should register multiple Ollama models
        assert any(model.name.startswith('OLLAMA_') for model in orchestrator.adapters.keys())
        mock_mcp_server.register_adapter.assert_called()

    def test_register_llama_cpp_adapter(self, orchestrator, mock_mcp_server):
        """Test registering Llama.cpp adapter."""
        model_paths = {"quantized_7b": "/path/to/model"}
        orchestrator.register_llama_cpp_adapter(model_paths)

        assert any(model.name.startswith('LLAMA_CPP_') for model in orchestrator.adapters.keys())
        mock_mcp_server.register_adapter.assert_called()

    @pytest.mark.asyncio
    async def test_generate_recommendation_success(self, orchestrator, mock_adapter, mock_mcp_server):
        """Test successful recommendation generation."""
        # Setup
        orchestrator.adapters[LLMModel.OPENAI_GPT4] = mock_adapter

        # Execute
        result = await orchestrator.generate_recommendation(
            symbol="AAPL",
            user_id="123",
            context_data={"test": "data"}
        )

        # Assert
        assert result["symbol"] == "AAPL"
        assert "recommendation" in result
        assert "model_used" in result
        assert result["model_used"] == "test-model"
        assert "session_id" in result

        mock_mcp_server.build_context.assert_called_once()
        mock_adapter.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_recommendation_fallback(self, orchestrator, mock_adapter, mock_mcp_server):
        """Test recommendation generation with fallback."""
        # Setup - first adapter fails, second succeeds
        failing_adapter = AsyncMock()
        failing_adapter.is_available = AsyncMock(return_value=False)

        orchestrator.adapters[LLMModel.OPENAI_GPT4] = failing_adapter
        orchestrator.adapters[LLMModel.OLLAMA_LLAMA2_13B] = mock_adapter

        # Execute
        result = await orchestrator.generate_recommendation("AAPL")

        # Assert
        assert result["symbol"] == "AAPL"
        mock_adapter.generate_response.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_recommendation_all_fail(self, orchestrator):
        """Test recommendation generation when all models fail."""
        # Setup - no available adapters
        failing_adapter = AsyncMock()
        failing_adapter.is_available = AsyncMock(return_value=False)
        orchestrator.adapters[LLMModel.OPENAI_GPT4] = failing_adapter

        # Execute & Assert
        with pytest.raises(ValueError, match="All LLM models failed"):
            await orchestrator.generate_recommendation("AAPL")

    def test_build_recommendation_prompt(self, orchestrator):
        """Test recommendation prompt building."""
        context_data = {
            "technical_indicators": {"rsi": 65, "macd": "bullish"},
            "fundamental_data": {"pe_ratio": 15.2},
            "sentiment": "positive",
            "user_profile": {"risk_tolerance": "moderate"}
        }

        prompt = orchestrator._build_recommendation_prompt("AAPL", context_data)

        assert "AAPL" in prompt
        assert "Technical Indicators" in prompt
        assert "Fundamental Data" in prompt
        assert "Market Sentiment" in prompt
        assert "User Profile" in prompt
        assert "BUY/HOLD/AVOID" in prompt

    def test_get_max_tokens(self, orchestrator):
        """Test max tokens configuration."""
        assert orchestrator._get_max_tokens(TaskComplexity.LOW) == 500
        assert orchestrator._get_max_tokens(TaskComplexity.MEDIUM) == 1000
        assert orchestrator._get_max_tokens(TaskComplexity.HIGH) == 2000
        assert orchestrator._get_max_tokens(TaskComplexity.CRITICAL) == 3000

    def test_get_temperature(self, orchestrator):
        """Test temperature configuration."""
        assert orchestrator._get_temperature(TaskComplexity.LOW) == 0.7
        assert orchestrator._get_temperature(TaskComplexity.MEDIUM) == 0.6
        assert orchestrator._get_temperature(TaskComplexity.HIGH) == 0.5
        assert orchestrator._get_temperature(TaskComplexity.CRITICAL) == 0.3

    def test_parse_recommendation_response_buy_signal(self, orchestrator):
        """Test parsing BUY signal from response."""
        response = "Based on analysis, I recommend BUYING this stock. Confidence: 85%"

        result = orchestrator._parse_recommendation_response(response)

        assert result["signal"] == "BUY"
        assert result["confidence"] == 85
        assert "reasons" in result
        assert "risks" in result

    def test_parse_recommendation_response_avoid_signal(self, orchestrator):
        """Test parsing AVOID signal from response."""
        response = "Analysis suggests AVOIDING this investment. Confidence: 92%"

        result = orchestrator._parse_recommendation_response(response)

        assert result["signal"] == "AVOID"
        assert result["confidence"] == 92

    def test_parse_recommendation_response_hold_default(self, orchestrator):
        """Test default HOLD signal when no clear signal."""
        response = "The stock shows mixed signals. Further analysis needed."

        result = orchestrator._parse_recommendation_response(response)

        assert result["signal"] == "HOLD"
        assert result["confidence"] == 50

    @pytest.mark.asyncio
    async def test_health_check(self, orchestrator, mock_adapter):
        """Test health check functionality."""
        # Setup
        orchestrator.adapters[LLMModel.OPENAI_GPT4] = mock_adapter

        # Execute
        health = await orchestrator.health_check()

        # Assert
        assert "overall_status" in health
        assert "models" in health
        assert "timestamp" in health
        assert "test-model" in health["models"]

    @pytest.mark.asyncio
    async def test_health_check_degraded(self, orchestrator, mock_adapter):
        """Test health check with degraded status."""
        # Setup - one available, one unavailable
        available_adapter = AsyncMock()
        available_adapter.is_available = AsyncMock(return_value=True)
        available_adapter.provider = "available_provider"

        unavailable_adapter = AsyncMock()
        unavailable_adapter.is_available = AsyncMock(return_value=False)
        unavailable_adapter.provider = "unavailable_provider"

        orchestrator.adapters[LLMModel.OPENAI_GPT4] = available_adapter
        orchestrator.adapters[LLMModel.OLLAMA_LLAMA2_13B] = unavailable_adapter

        # Execute
        health = await orchestrator.health_check()

        # Assert
        assert health["overall_status"] == "degraded"

    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, orchestrator):
        """Test health check with unhealthy status."""
        # Setup - no available adapters
        unavailable_adapter = AsyncMock()
        unavailable_adapter.is_available = AsyncMock(return_value=False)
        unavailable_adapter.provider = "unavailable_provider"

        orchestrator.adapters[LLMModel.OPENAI_GPT4] = unavailable_adapter

        # Execute
        health = await orchestrator.health_check()

        # Assert
        assert health["overall_status"] == "unhealthy"


class TestTaskComplexity:
    """Test TaskComplexity enum."""

    def test_complexity_values(self):
        """Test complexity enum values."""
        assert TaskComplexity.LOW.value == "low"
        assert TaskComplexity.MEDIUM.value == "medium"
        assert TaskComplexity.HIGH.value == "high"
        assert TaskComplexity.CRITICAL.value == "critical"


class TestLLMModel:
    """Test LLMModel enum."""

    def test_model_values(self):
        """Test model enum values."""
        assert LLMModel.OPENAI_GPT4.value == "openai-gpt-4"
        assert LLMModel.OPENAI_GPT35.value == "openai-gpt-3.5-turbo"
        assert LLMModel.OLLAMA_LLAMA2_13B.value == "ollama-llama2:13b"
        assert LLMModel.LLAMA_CPP_QUANTIZED_7B.value == "llama-cpp-quantized-7b"