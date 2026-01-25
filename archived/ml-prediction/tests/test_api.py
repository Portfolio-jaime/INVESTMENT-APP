"""API endpoint tests for ML Prediction Service."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test health check returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root(self):
        """Test root endpoint returns service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert "predictions" in data
        assert "models" in data


# Note: Integration tests with external services would require mocking
# the httpx calls to Market Data Service and Analysis Engine
