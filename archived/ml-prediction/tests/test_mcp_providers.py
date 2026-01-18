"""Unit tests for MCP resource and tool providers."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.mcp.providers import MarketDataProvider, UserProfileProvider, MCPResourceProvider, MCPToolProvider
from app.mcp.context import MCPResource, MCPResourceContent


class TestMCPResourceProvider:
    """Test base MCP resource provider."""

    def test_abstract_methods(self):
        """Test that abstract methods raise NotImplementedError."""
        provider = MCPResourceProvider()

        with pytest.raises(NotImplementedError):
            provider.get_resources()

        with pytest.raises(NotImplementedError):
            provider.get_resource_content("test://uri")

        with pytest.raises(NotImplementedError):
            provider.provider_type


class TestMCPToolProvider:
    """Test base MCP tool provider."""

    def test_abstract_methods(self):
        """Test that abstract methods raise NotImplementedError."""
        provider = MCPToolProvider()

        with pytest.raises(NotImplementedError):
            provider.get_tools()

        with pytest.raises(NotImplementedError):
            provider.execute_tool("test_tool", {})

        with pytest.raises(NotImplementedError):
            provider.provider_type


class TestMarketDataProvider:
    """Test market data resource provider."""

    @pytest.fixture
    def mock_market_client(self):
        """Mock market data client."""
        client = AsyncMock()
        client.get_real_time_quote = AsyncMock(return_value={"price": 100.0, "volume": 1000})
        client.get_historical_data = AsyncMock(return_value=[{"date": "2023-01-01", "price": 100.0}])
        return client

    @pytest.fixture
    def provider(self, mock_market_client):
        """Create market data provider instance."""
        return MarketDataProvider(mock_market_client)

    def test_provider_type(self, provider):
        """Test provider type."""
        assert provider.provider_type == "market_data"

    @pytest.mark.asyncio
    async def test_get_resources_with_symbol(self, provider):
        """Test getting resources for specific symbol."""
        resources = await provider.get_resources(symbol="AAPL")

        assert len(resources) == 2
        assert resources[0].uri == "market-data://AAPL/quote"
        assert resources[0].name == "Current Quote - AAPL"
        assert resources[0].resource_type == "market_data"
        assert resources[1].uri == "market-data://AAPL/history"

    @pytest.mark.asyncio
    async def test_get_resources_without_symbol(self, provider):
        """Test getting general market resources."""
        resources = await provider.get_resources()

        assert len(resources) == 1
        assert resources[0].uri == "market-data://market/overview"
        assert resources[0].name == "Market Overview"

    @pytest.mark.asyncio
    async def test_get_quote_resource_content(self, provider, mock_market_client):
        """Test getting quote resource content."""
        uri = "market-data://AAPL/quote"
        content = await provider.get_resource_content(uri)

        assert content is not None
        assert content.uri == uri
        assert content.mime_type == "application/json"
        mock_market_client.get_real_time_quote.assert_called_once_with("AAPL")

    @pytest.mark.asyncio
    async def test_get_history_resource_content(self, provider, mock_market_client):
        """Test getting history resource content."""
        uri = "market-data://AAPL/history"
        content = await provider.get_resource_content(uri)

        assert content is not None
        assert content.uri == uri
        assert content.mime_type == "application/json"
        mock_market_client.get_historical_data.assert_called_once_with("AAPL")

    @pytest.mark.asyncio
    async def test_get_invalid_resource_content(self, provider):
        """Test getting content for invalid URI."""
        content = await provider.get_resource_content("invalid://uri")
        assert content is None

    @pytest.mark.asyncio
    async def test_get_resources_with_exception(self, provider, mock_market_client):
        """Test handling exceptions in get_resources."""
        mock_market_client.get_real_time_quote.side_effect = Exception("API Error")

        # Should return empty list on exception
        resources = await provider.get_resources(symbol="AAPL")
        assert resources == []


class TestUserProfileProvider:
    """Test user profile resource provider."""

    @pytest.fixture
    def mock_user_service(self):
        """Mock user service."""
        service = AsyncMock()
        service.get_user_profile = AsyncMock(return_value={"user_id": "123", "risk_tolerance": "moderate"})
        service.get_user_portfolio = AsyncMock(return_value={"holdings": [{"symbol": "AAPL", "shares": 100}]})
        service.get_trading_history = AsyncMock(return_value=[{"symbol": "AAPL", "action": "BUY", "date": "2023-01-01"}])
        return service

    @pytest.fixture
    def provider(self, mock_user_service):
        """Create user profile provider instance."""
        return UserProfileProvider(mock_user_service)

    def test_provider_type(self, provider):
        """Test provider type."""
        assert provider.provider_type == "user_profile"

    @pytest.mark.asyncio
    async def test_get_resources_with_user_id(self, provider):
        """Test getting resources for specific user."""
        resources = await provider.get_resources(user_id="123")

        assert len(resources) == 3
        assert resources[0].uri == "user-profile://123/profile"
        assert resources[0].name == "User Profile - 123"
        assert resources[0].resource_type == "user_profile"
        assert resources[1].uri == "user-profile://123/portfolio"
        assert resources[2].uri == "user-profile://123/history"

    @pytest.mark.asyncio
    async def test_get_resources_without_user_id(self, provider):
        """Test getting resources without user ID."""
        resources = await provider.get_resources()
        assert resources == []

    @pytest.mark.asyncio
    async def test_get_profile_resource_content(self, provider, mock_user_service):
        """Test getting profile resource content."""
        uri = "user-profile://123/profile"
        content = await provider.get_resource_content(uri)

        assert content is not None
        assert content.uri == uri
        assert content.mime_type == "application/json"
        mock_user_service.get_user_profile.assert_called_once_with("123")

    @pytest.mark.asyncio
    async def test_get_portfolio_resource_content(self, provider, mock_user_service):
        """Test getting portfolio resource content."""
        uri = "user-profile://123/portfolio"
        content = await provider.get_resource_content(uri)

        assert content is not None
        assert content.uri == uri
        assert content.mime_type == "application/json"
        mock_user_service.get_user_portfolio.assert_called_once_with("123")

    @pytest.mark.asyncio
    async def test_get_history_resource_content(self, provider, mock_user_service):
        """Test getting history resource content."""
        uri = "user-profile://123/history"
        content = await provider.get_resource_content(uri)

        assert content is not None
        assert content.uri == uri
        assert content.mime_type == "application/json"
        mock_user_service.get_trading_history.assert_called_once_with("123")

    @pytest.mark.asyncio
    async def test_get_invalid_resource_content(self, provider):
        """Test getting content for invalid URI."""
        content = await provider.get_resource_content("invalid://uri")
        assert content is None

    @pytest.mark.asyncio
    async def test_get_resources_with_exception(self, provider, mock_user_service):
        """Test handling exceptions in get_resources."""
        mock_user_service.get_user_profile.side_effect = Exception("Service Error")

        # Should return empty list on exception
        resources = await provider.get_resources(user_id="123")
        assert resources == []