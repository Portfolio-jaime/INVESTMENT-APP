"""Unit tests for quote endpoints."""

import pytest
from httpx import AsyncClient
from datetime import datetime


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_get_quote_invalid_symbol(client: AsyncClient):
    """Test getting quote for invalid symbol."""
    response = await client.get("/api/v1/market-data/quotes/INVALID123")
    # Should return 404 or handle gracefully
    assert response.status_code in [404, 500]


@pytest.mark.asyncio
async def test_search_symbols(client: AsyncClient):
    """Test symbol search."""
    response = await client.get("/api/v1/market-data/search?query=AAPL")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
