"""MCP Server for managing context and model interactions."""

from typing import List, Dict, Any, Optional
import structlog
from datetime import datetime, timedelta

from .context import MCPContext, MCPRequest, MCPResponse, MCPResource
from .providers import MCPResourceProvider
from .adapters import MCPModelAdapter

logger = structlog.get_logger()


class MCPServer:
    """MCP Server for managing context providers and model adapters."""

    def __init__(self):
        self.providers: Dict[str, MCPResourceProvider] = {}
        self.adapters: Dict[str, MCPModelAdapter] = {}
        self.context_cache: Dict[str, MCPContext] = {}
        self.cache_ttl = 300  # 5 minutes

    def register_provider(self, provider: MCPResourceProvider):
        """Register a resource provider."""
        self.providers[provider.provider_type] = provider
        logger.info("Registered MCP provider", provider_type=provider.provider_type)

    def register_adapter(self, adapter: MCPModelAdapter):
        """Register a model adapter."""
        self.adapters[adapter.model_name] = adapter
        logger.info("Registered MCP adapter", model_name=adapter.model_name)

    async def build_context(self, session_id: str, user_id: Optional[str] = None,
                          symbol: Optional[str] = None, include_tools: bool = False) -> MCPContext:
        """Build MCP context from registered providers."""

        # Check cache first
        cache_key = f"{session_id}_{user_id}_{symbol}"
        if cache_key in self.context_cache:
            cached_context = self.context_cache[cache_key]
            if cached_context.expires_at and cached_context.expires_at > datetime.utcnow():
                logger.info("Using cached MCP context", session_id=session_id)
                return cached_context

        logger.info("Building MCP context", session_id=session_id, user_id=user_id, symbol=symbol)

        context = MCPContext(
            session_id=session_id,
            user_id=user_id,
            expires_at=datetime.utcnow() + timedelta(seconds=self.cache_ttl)
        )

        # Gather resources from providers
        for provider_type, provider in self.providers.items():
            try:
                if provider_type == "market_data" and symbol:
                    resources = await provider.get_resources(symbol=symbol)
                elif provider_type == "user_profile" and user_id:
                    resources = await provider.get_resources(user_id=user_id)
                else:
                    resources = await provider.get_resources()

                context.resources.extend(resources)

            except Exception as e:
                logger.error("Failed to get resources from provider",
                           provider_type=provider_type, error=str(e))

        # Gather tools if requested
        if include_tools:
            for provider_type, provider in self.providers.items():
                if hasattr(provider, 'get_tools'):
                    try:
                        tools = await provider.get_tools()
                        context.tools.extend(tools)
                    except Exception as e:
                        logger.error("Failed to get tools from provider",
                                   provider_type=provider_type, error=str(e))

        # Cache the context
        self.context_cache[cache_key] = context

        logger.info("MCP context built",
                   session_id=session_id,
                   resources_count=len(context.resources),
                   tools_count=len(context.tools))

        return context

    async def generate_response(self, request: MCPRequest) -> MCPResponse:
        """Generate response using available model adapters."""

        # Select best available adapter
        adapter = await self._select_adapter(request)

        if not adapter:
            raise ValueError("No suitable model adapter available")

        logger.info("Selected adapter for generation",
                   adapter=adapter.model_name,
                   provider=adapter.provider)

        try:
            response = await adapter.generate_response(request)

            # Add context metadata
            response.metadata.update({
                "session_id": request.context.session_id,
                "resources_used": len(request.context.resources),
                "tools_used": len(request.context.tools)
            })

            return response

        except Exception as e:
            logger.error("Model generation failed",
                        adapter=adapter.model_name,
                        error=str(e))
            raise

    async def _select_adapter(self, request: MCPRequest) -> Optional[MCPModelAdapter]:
        """Select the best available adapter based on preferences and availability."""

        # Check preferred models first
        for model_name in request.model_preferences:
            if model_name in self.adapters:
                adapter = self.adapters[model_name]
                if await adapter.is_available():
                    return adapter

        # Fallback to any available adapter
        for adapter in self.adapters.values():
            if await adapter.is_available():
                return adapter

        return None

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models."""
        available_models = []

        for adapter in self.adapters.values():
            try:
                is_available = await adapter.is_available()
                available_models.append({
                    "name": adapter.model_name,
                    "provider": adapter.provider,
                    "available": is_available
                })
            except Exception as e:
                logger.error("Failed to check adapter availability",
                           adapter=adapter.model_name, error=str(e))
                available_models.append({
                    "name": adapter.model_name,
                    "provider": adapter.provider,
                    "available": False,
                    "error": str(e)
                })

        return available_models

    async def get_resource_content(self, uri: str) -> Optional[Any]:
        """Get content for a specific resource URI."""

        # Find the provider that can handle this URI
        for provider in self.providers.values():
            try:
                content = await provider.get_resource_content(uri)
                if content:
                    return content
            except Exception as e:
                logger.error("Failed to get resource content from provider",
                           provider=provider.provider_type, uri=uri, error=str(e))

        return None

    def clear_cache(self, session_id: Optional[str] = None):
        """Clear context cache."""
        if session_id:
            # Clear specific session
            keys_to_remove = [k for k in self.context_cache.keys() if k.startswith(session_id)]
            for key in keys_to_remove:
                del self.context_cache[key]
            logger.info("Cleared cache for session", session_id=session_id)
        else:
            # Clear all cache
            self.context_cache.clear()
            logger.info("Cleared all MCP context cache")


# Global MCP server instance
mcp_server = MCPServer()