"""Test health check endpoints."""
import pytest


@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    """Test health check returns healthy status."""
    response = await test_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_readiness_endpoint(test_client):
    """Test readiness check returns ready status."""
    response = await test_client.get("/api/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
