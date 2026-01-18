"""Hybrid LLM Orchestrator for managing multiple LLM providers."""

from typing import List, Dict, Any, Optional, Union
from enum import Enum
import structlog
from datetime import datetime

from app.mcp.adapters import OpenAIAdapter, OllamaAdapter, LlamaCppAdapter
from app.mcp.context import MCPRequest, MCPResponse
from app.mcp.server import mcp_server

logger = structlog.get_logger()


class LLMModel(Enum):
    """Available LLM models."""
    OPENAI_GPT4 = "openai-gpt-4"
    OPENAI_GPT35 = "openai-gpt-3.5-turbo"
    OLLAMA_LLAMA2_13B = "ollama-llama2:13b"
    OLLAMA_LLAMA2_7B = "ollama-llama2:7b"
    OLLAMA_CODELLAMA = "ollama-codellama"
    LLAMA_CPP_QUANTIZED_7B = "llama-cpp-quantized-7b"
    LLAMA_CPP_QUANTIZED_13B = "llama-cpp-quantized-13b"


class TaskComplexity(Enum):
    """Task complexity levels."""
    LOW = "low"        # Simple queries, basic analysis
    MEDIUM = "medium"  # Moderate analysis, recommendations
    HIGH = "high"      # Complex analysis, detailed reasoning
    CRITICAL = "critical"  # High-stakes decisions, detailed reports


class LLMOrchestrator:
    """Orchestrator for hybrid LLM operations with intelligent model selection."""

    def __init__(self):
        self.adapters: Dict[str, Any] = {}
        self.model_preferences = self._get_model_preferences()
        self.fallback_chain = self._get_fallback_chain()

    def _get_model_preferences(self) -> Dict[TaskComplexity, List[LLMModel]]:
        """Define model preferences based on task complexity."""
        return {
            TaskComplexity.CRITICAL: [
                LLMModel.OPENAI_GPT4,
                LLMModel.OLLAMA_LLAMA2_13B,
                LLMModel.LLAMA_CPP_QUANTIZED_13B
            ],
            TaskComplexity.HIGH: [
                LLMModel.OPENAI_GPT4,
                LLMModel.OLLAMA_LLAMA2_13B,
                LLMModel.OPENAI_GPT35,
                LLMModel.LLAMA_CPP_QUANTIZED_13B
            ],
            TaskComplexity.MEDIUM: [
                LLMModel.OLLAMA_LLAMA2_13B,
                LLMModel.OPENAI_GPT35,
                LLMModel.OLLAMA_LLAMA2_7B,
                LLMModel.LLAMA_CPP_QUANTIZED_7B
            ],
            TaskComplexity.LOW: [
                LLMModel.OLLAMA_LLAMA2_7B,
                LLMModel.LLAMA_CPP_QUANTIZED_7B,
                LLMModel.OLLAMA_CODELLAMA,
                LLMModel.OPENAI_GPT35
            ]
        }

    def _get_fallback_chain(self) -> List[LLMModel]:
        """Define fallback chain for when preferred models fail."""
        return [
            LLMModel.OPENAI_GPT4,
            LLMModel.OLLAMA_LLAMA2_13B,
            LLMModel.OPENAI_GPT35,
            LLMModel.OLLAMA_LLAMA2_7B,
            LLMModel.LLAMA_CPP_QUANTIZED_13B,
            LLMModel.LLAMA_CPP_QUANTIZED_7B,
            LLMModel.OLLAMA_CODELLAMA
        ]

    def register_openai_adapter(self, api_key: str, model: str = "gpt-4"):
        """Register OpenAI adapter."""
        adapter = OpenAIAdapter(api_key=api_key, model=model)
        self.adapters[LLMModel.OPENAI_GPT4] = adapter
        self.adapters[LLMModel.OPENAI_GPT35] = OpenAIAdapter(api_key=api_key, model="gpt-3.5-turbo")
        mcp_server.register_adapter(adapter)
        logger.info("Registered OpenAI adapters")

    def register_ollama_adapter(self, base_url: str = "http://localhost:11434"):
        """Register Ollama adapters."""
        models = ["llama2:13b", "llama2:7b", "codellama"]
        for model in models:
            adapter = OllamaAdapter(base_url=base_url, model=model)
            model_enum = getattr(LLMModel, f"OLLAMA_{model.upper().replace(':', '_')}")
            self.adapters[model_enum] = adapter
            mcp_server.register_adapter(adapter)
        logger.info("Registered Ollama adapters")

    def register_llama_cpp_adapter(self, model_paths: Dict[str, str]):
        """Register Llama.cpp adapters."""
        for model_name, path in model_paths.items():
            adapter = LlamaCppAdapter(model_path=path)
            model_enum = getattr(LLMModel, f"LLAMA_CPP_{model_name.upper()}")
            self.adapters[model_enum] = adapter
            mcp_server.register_adapter(adapter)
        logger.info("Registered Llama.cpp adapters")

    async def generate_recommendation(
        self,
        symbol: str,
        user_id: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None,
        task_complexity: TaskComplexity = TaskComplexity.MEDIUM
    ) -> Dict[str, Any]:
        """
        Generate investment recommendation using hybrid LLM approach.

        Args:
            symbol: Stock symbol
            user_id: User identifier for personalization
            context_data: Additional context data
            task_complexity: Complexity level of the task

        Returns:
            Dictionary containing recommendation and metadata
        """

        logger.info("Generating recommendation",
                   symbol=symbol,
                   user_id=user_id,
                   complexity=task_complexity.value)

        # Build MCP context
        session_id = f"rec_{symbol}_{user_id or 'anon'}_{datetime.utcnow().timestamp()}"
        context = await mcp_server.build_context(
            session_id=session_id,
            user_id=user_id,
            symbol=symbol,
            include_tools=True
        )

        # Prepare prompt
        prompt = self._build_recommendation_prompt(symbol, context_data or {})

        # Create MCP request
        request = MCPRequest(
            prompt=prompt,
            context=context,
            model_preferences=[model.value for model in self.model_preferences[task_complexity]],
            max_tokens=self._get_max_tokens(task_complexity),
            temperature=self._get_temperature(task_complexity)
        )

        # Generate response with fallback
        response = await self._generate_with_fallback(request)

        # Parse and structure response
        recommendation = self._parse_recommendation_response(response.content)

        return {
            "symbol": symbol,
            "recommendation": recommendation,
            "model_used": response.model_used,
            "confidence_score": response.confidence_score,
            "generated_at": response.generated_at,
            "session_id": session_id,
            "complexity": task_complexity.value
        }

    async def _generate_with_fallback(self, request: MCPRequest) -> MCPResponse:
        """Generate response with intelligent fallback strategy."""

        # Try preferred models first
        for model_name in request.model_preferences:
            try:
                model_enum = LLMModel(model_name)
                if model_enum in self.adapters:
                    adapter = self.adapters[model_enum]
                    if await adapter.is_available():
                        logger.info("Attempting generation with model", model=model_name)
                        response = await adapter.generate_response(request)
                        return response
            except Exception as e:
                logger.warning("Model failed, trying next", model=model_name, error=str(e))
                continue

        # Try fallback chain
        for model_enum in self.fallback_chain:
            try:
                if model_enum in self.adapters:
                    adapter = self.adapters[model_enum]
                    if await adapter.is_available():
                        logger.info("Attempting fallback generation with model", model=model_enum.value)
                        response = await adapter.generate_response(request)
                        return response
            except Exception as e:
                logger.warning("Fallback model failed", model=model_enum.value, error=str(e))
                continue

        raise ValueError("All LLM models failed to generate response")

    def _build_recommendation_prompt(self, symbol: str, context_data: Dict[str, Any]) -> str:
        """Build comprehensive recommendation prompt."""

        prompt_parts = [
            f"Generate an investment recommendation for {symbol} based on the following context:",
            "",
            "Context Information:"
        ]

        # Add market data context
        if "technical_indicators" in context_data:
            prompt_parts.append(f"Technical Indicators: {context_data['technical_indicators']}")

        if "fundamental_data" in context_data:
            prompt_parts.append(f"Fundamental Data: {context_data['fundamental_data']}")

        if "sentiment" in context_data:
            prompt_parts.append(f"Market Sentiment: {context_data['sentiment']}")

        if "user_profile" in context_data:
            prompt_parts.append(f"User Profile: {context_data['user_profile']}")

        prompt_parts.extend([
            "",
            "Please provide:",
            "1. Investment signal (BUY/HOLD/AVOID)",
            "2. Confidence level (0-100%)",
            "3. Key reasons for the recommendation",
            "4. Risk considerations",
            "5. Time horizon suggestion",
            "",
            "Format your response as a structured analysis with clear sections."
        ])

        return "\n".join(prompt_parts)

    def _get_max_tokens(self, complexity: TaskComplexity) -> int:
        """Get appropriate max tokens based on complexity."""
        token_limits = {
            TaskComplexity.LOW: 500,
            TaskComplexity.MEDIUM: 1000,
            TaskComplexity.HIGH: 2000,
            TaskComplexity.CRITICAL: 3000
        }
        return token_limits[complexity]

    def _get_temperature(self, complexity: TaskComplexity) -> float:
        """Get appropriate temperature based on complexity."""
        # Lower temperature for more deterministic responses in critical tasks
        temperature_settings = {
            TaskComplexity.LOW: 0.7,
            TaskComplexity.MEDIUM: 0.6,
            TaskComplexity.HIGH: 0.5,
            TaskComplexity.CRITICAL: 0.3
        }
        return temperature_settings[complexity]

    def _parse_recommendation_response(self, response_content: str) -> Dict[str, Any]:
        """Parse LLM response into structured recommendation."""
        # Basic parsing - in production, this would be more sophisticated
        lines = response_content.split('\n')

        recommendation = {
            "signal": "HOLD",  # default
            "confidence": 50,
            "reasons": [],
            "risks": [],
            "time_horizon": "medium_term",
            "raw_response": response_content
        }

        # Simple keyword-based parsing
        content_lower = response_content.lower()

        if "buy" in content_lower and "avoid" not in content_lower:
            recommendation["signal"] = "BUY"
        elif "avoid" in content_lower or "sell" in content_lower:
            recommendation["signal"] = "AVOID"

        # Extract confidence if mentioned
        import re
        confidence_match = re.search(r'confidence[:\s]+(\d+)%?', content_lower)
        if confidence_match:
            recommendation["confidence"] = min(int(confidence_match.group(1)), 100)

        return recommendation

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get status of all registered models."""
        return await mcp_server.get_available_models()

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all LLM providers."""
        health_status = {
            "overall_status": "healthy",
            "models": {},
            "timestamp": datetime.utcnow()
        }

        available_count = 0

        for model_enum, adapter in self.adapters.items():
            try:
                is_available = await adapter.is_available()
                health_status["models"][model_enum.value] = {
                    "available": is_available,
                    "provider": adapter.provider
                }
                if is_available:
                    available_count += 1
            except Exception as e:
                health_status["models"][model_enum.value] = {
                    "available": False,
                    "error": str(e),
                    "provider": adapter.provider
                }

        # Determine overall status
        if available_count == 0:
            health_status["overall_status"] = "unhealthy"
        elif available_count < len(self.adapters) * 0.5:
            health_status["overall_status"] = "degraded"

        return health_status


# Global orchestrator instance
llm_orchestrator = LLMOrchestrator()