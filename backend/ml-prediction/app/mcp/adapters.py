"""MCP Model Adapters for different LLM providers."""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import structlog

from .context import MCPRequest, MCPResponse

logger = structlog.get_logger()


class MCPModelAdapter(ABC):
    """Abstract base class for MCP model adapters."""

    @abstractmethod
    async def generate_response(self, request: MCPRequest) -> MCPResponse:
        """Generate response using the model."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the model is available and configured."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Model identifier."""
        pass

    @property
    @abstractmethod
    def provider(self) -> str:
        """Provider name (openai, ollama, llama-cpp)."""
        pass


class OpenAIAdapter(MCPModelAdapter):
    """OpenAI GPT model adapter."""

    def __init__(self, api_key: str, model: str = "gpt-4", temperature: float = 0.7, max_tokens: int = 2000):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.client = None

        if api_key:
            try:
                import openai
                openai.api_key = api_key
                self.client = openai
            except ImportError:
                logger.warning("OpenAI package not available")

    @property
    def model_name(self) -> str:
        return f"openai-{self.model}"

    @property
    def provider(self) -> str:
        return "openai"

    async def is_available(self) -> bool:
        return self.client is not None and self.api_key is not None

    async def generate_response(self, request: MCPRequest) -> MCPResponse:
        """Generate response using OpenAI."""
        if not await self.is_available():
            raise ValueError("OpenAI client not available")

        try:
            logger.info("Generating response with OpenAI", model=self.model)

            # Prepare messages
            messages = [
                {
                    "role": "system",
                    "content": "You are a professional financial analyst providing investment recommendations. Be objective, data-driven, and consider risk management."
                },
                {
                    "role": "user",
                    "content": request.prompt
                }
            ]

            # Make API call
            response = await self.client.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                temperature=request.temperature or self.temperature,
                max_tokens=request.max_tokens or self.max_tokens,
                timeout=30
            )

            content = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else None

            return MCPResponse(
                content=content,
                model_used=self.model_name,
                tokens_used=tokens_used,
                metadata={
                    "finish_reason": response.choices[0].finish_reason,
                    "model": self.model
                }
            )

        except Exception as e:
            logger.error("OpenAI generation failed", error=str(e), model=self.model)
            raise


class OllamaAdapter(MCPModelAdapter):
    """Ollama local model adapter."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2:13b", temperature: float = 0.7):
        self.base_url = base_url
        self.model = model
        self.temperature = temperature
        self.client = None

        try:
            import ollama
            self.client = ollama.Client(host=base_url)
        except ImportError:
            logger.warning("Ollama package not available")

    @property
    def model_name(self) -> str:
        return f"ollama-{self.model}"

    @property
    def provider(self) -> str:
        return "ollama"

    async def is_available(self) -> bool:
        if not self.client:
            return False

        try:
            # Check if model is available
            available_models = await self.client.list()
            model_names = [m['name'] for m in available_models.get('models', [])]
            return self.model in model_names
        except Exception:
            return False

    async def generate_response(self, request: MCPRequest) -> MCPResponse:
        """Generate response using Ollama."""
        if not await self.is_available():
            raise ValueError("Ollama client not available or model not found")

        try:
            logger.info("Generating response with Ollama", model=self.model)

            # Prepare request
            ollama_request = {
                "model": self.model,
                "prompt": request.prompt,
                "stream": False,
                "options": {
                    "temperature": request.temperature or self.temperature,
                    "num_predict": request.max_tokens or 2000
                }
            }

            # Make API call
            response = await self.client.generate(**ollama_request)

            return MCPResponse(
                content=response.get('response', '').strip(),
                model_used=self.model_name,
                metadata={
                    "eval_count": response.get('eval_count'),
                    "eval_duration": response.get('eval_duration'),
                    "total_duration": response.get('total_duration')
                }
            )

        except Exception as e:
            logger.error("Ollama generation failed", error=str(e), model=self.model)
            raise


class LlamaCppAdapter(MCPModelAdapter):
    """Llama.cpp local model adapter."""

    def __init__(self, model_path: str, n_ctx: int = 2048, temperature: float = 0.7):
        self.model_path = model_path
        self.n_ctx = n_ctx
        self.temperature = temperature
        self.llm = None

        try:
            from llama_cpp import Llama
            self.llm = Llama(
                model_path=model_path,
                n_ctx=n_ctx,
                verbose=False
            )
        except ImportError:
            logger.warning("llama-cpp-python package not available")
        except Exception as e:
            logger.error("Failed to initialize Llama model", error=str(e))

    @property
    def model_name(self) -> str:
        return f"llama-cpp-{self.model_path.split('/')[-1]}"

    @property
    def provider(self) -> str:
        return "llama-cpp"

    async def is_available(self) -> bool:
        return self.llm is not None

    async def generate_response(self, request: MCPRequest) -> MCPResponse:
        """Generate response using Llama.cpp."""
        if not await self.is_available():
            raise ValueError("Llama.cpp model not available")

        try:
            logger.info("Generating response with Llama.cpp", model_path=self.model_path)

            # Generate response
            output = self.llm(
                request.prompt,
                max_tokens=request.max_tokens or 2000,
                temperature=request.temperature or self.temperature,
                echo=False
            )

            content = output['choices'][0]['text'].strip()

            return MCPResponse(
                content=content,
                model_used=self.model_name,
                metadata={
                    "usage": output.get('usage', {}),
                    "finish_reason": output['choices'][0].get('finish_reason')
                }
            )

        except Exception as e:
            logger.error("Llama.cpp generation failed", error=str(e))
            raise