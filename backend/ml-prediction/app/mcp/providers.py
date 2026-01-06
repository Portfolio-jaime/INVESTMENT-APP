"""MCP Resource and Tool Providers."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import structlog

from .context import MCPResource, MCPResourceContent, MCPTool, MCPContext

logger = structlog.get_logger()


class MCPResourceProvider(ABC):
    """Abstract base class for MCP resource providers."""

    @abstractmethod
    async def get_resources(self, **kwargs) -> List[MCPResource]:
        """Get list of available resources."""
        pass

    @abstractmethod
    async def get_resource_content(self, uri: str) -> Optional[MCPResourceContent]:
        """Get content of a specific resource."""
        pass

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Provider type identifier."""
        pass


class MCPToolProvider(ABC):
    """Abstract base class for MCP tool providers."""

    @abstractmethod
    async def get_tools(self, **kwargs) -> List[MCPTool]:
        """Get list of available tools."""
        pass

    @abstractmethod
    async def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Any:
        """Execute a tool with given parameters."""
        pass

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Provider type identifier."""
        pass


class MarketDataProvider(MCPResourceProvider):
    """Market data resource provider."""

    def __init__(self, market_data_client):
        self.market_data_client = market_data_client

    @property
    def provider_type(self) -> str:
        return "market_data"

    async def get_resources(self, symbol: Optional[str] = None, **kwargs) -> List[MCPResource]:
        """Get market data resources for a symbol or all available."""
        try:
            # This would integrate with the market-data service
            resources = []

            if symbol:
                resources.extend([
                    MCPResource(
                        uri=f"market-data://{symbol}/quote",
                        name=f"Current Quote - {symbol}",
                        description=f"Real-time quote data for {symbol}",
                        resource_type="market_data"
                    ),
                    MCPResource(
                        uri=f"market-data://{symbol}/history",
                        name=f"Price History - {symbol}",
                        description=f"Historical price data for {symbol}",
                        resource_type="market_data"
                    )
                ])
            else:
                # Return general market resources
                resources.append(
                    MCPResource(
                        uri="market-data://market/overview",
                        name="Market Overview",
                        description="General market overview and indices",
                        resource_type="market_data"
                    )
                )

            return resources

        except Exception as e:
            logger.error("Failed to get market data resources", error=str(e))
            return []

    async def get_resource_content(self, uri: str) -> Optional[MCPResourceContent]:
        """Get content for market data resource."""
        try:
            # Parse URI and fetch data
            if uri.startswith("market-data://"):
                path = uri.replace("market-data://", "")
                parts = path.split("/")

                if len(parts) >= 2:
                    symbol = parts[0]
                    data_type = parts[1]

                    if data_type == "quote":
                        # Fetch current quote
                        data = await self.market_data_client.get_real_time_quote(symbol)
                        return MCPResourceContent(
                            uri=uri,
                            text=str(data),
                            mime_type="application/json"
                        )
                    elif data_type == "history":
                        # Fetch historical data
                        data = await self.market_data_client.get_historical_data(symbol)
                        return MCPResourceContent(
                            uri=uri,
                            text=str(data),
                            mime_type="application/json"
                        )

            return None

        except Exception as e:
            logger.error("Failed to get market data resource content", uri=uri, error=str(e))
            return None


class UserProfileProvider(MCPResourceProvider):
    """User profile resource provider."""

    def __init__(self, user_service):
        self.user_service = user_service

    @property
    def provider_type(self) -> str:
        return "user_profile"

    async def get_resources(self, user_id: Optional[str] = None, **kwargs) -> List[MCPResource]:
        """Get user profile resources."""
        if not user_id:
            return []

        try:
            resources = [
                MCPResource(
                    uri=f"user-profile://{user_id}/profile",
                    name=f"User Profile - {user_id}",
                    description=f"Investment profile and preferences for user {user_id}",
                    resource_type="user_profile"
                ),
                MCPResource(
                    uri=f"user-profile://{user_id}/portfolio",
                    name=f"Portfolio - {user_id}",
                    description=f"Current portfolio holdings for user {user_id}",
                    resource_type="portfolio"
                ),
                MCPResource(
                    uri=f"user-profile://{user_id}/history",
                    name=f"Trading History - {user_id}",
                    description=f"Trading and investment history for user {user_id}",
                    resource_type="user_profile"
                )
            ]

            return resources

        except Exception as e:
            logger.error("Failed to get user profile resources", user_id=user_id, error=str(e))
            return []

    async def get_resource_content(self, uri: str) -> Optional[MCPResourceContent]:
        """Get content for user profile resource."""
        try:
            if uri.startswith("user-profile://"):
                path = uri.replace("user-profile://", "")
                parts = path.split("/")

                if len(parts) >= 2:
                    user_id = parts[0]
                    resource_type = parts[1]

                    if resource_type == "profile":
                        data = await self.user_service.get_user_profile(user_id)
                        return MCPResourceContent(
                            uri=uri,
                            text=str(data),
                            mime_type="application/json"
                        )
                    elif resource_type == "portfolio":
                        data = await self.user_service.get_user_portfolio(user_id)
                        return MCPResourceContent(
                            uri=uri,
                            text=str(data),
                            mime_type="application/json"
                        )
                    elif resource_type == "history":
                        data = await self.user_service.get_trading_history(user_id)
                        return MCPResourceContent(
                            uri=uri,
                            text=str(data),
                            mime_type="application/json"
                        )

            return None

        except Exception as e:
            logger.error("Failed to get user profile resource content", uri=uri, error=str(e))
            return None