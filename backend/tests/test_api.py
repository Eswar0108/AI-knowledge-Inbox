"""
Basic API tests for the AI Knowledge Inbox backend.

Tests the three main endpoints:
- POST /api/ingest
- GET /api/items
- POST /api/query

Run with: python -m pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    """Create a TestClient that triggers lifespan events."""
    with TestClient(app) as c:
        yield c


class TestHealthCheck:
    """Test the health check endpoint."""

    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestIngestEndpoint:
    """Test POST /api/ingest."""

    def test_ingest_note_success(self, client):
        response = client.post("/api/ingest", json={
            "type": "note",
            "content": "Python is a high-level programming language known for its readability. "
                       "It supports multiple programming paradigms including procedural, "
                       "object-oriented, and functional programming."
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["chunks_created"] >= 1
        assert "Successfully" in data["message"]

    def test_ingest_empty_content_fails(self, client):
        response = client.post("/api/ingest", json={
            "type": "note",
            "content": ""
        })
        # Pydantic validation returns 422
        assert response.status_code == 422

    def test_ingest_invalid_type_fails(self, client):
        response = client.post("/api/ingest", json={
            "type": "invalid",
            "content": "Some text"
        })
        assert response.status_code == 422

    def test_ingest_missing_fields_fails(self, client):
        response = client.post("/api/ingest", json={})
        assert response.status_code == 422


class TestItemsEndpoint:
    """Test GET /api/items."""

    def test_get_items_returns_list(self, client):
        response = client.get("/api/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)


class TestQueryEndpoint:
    """Test POST /api/query."""

    def test_query_empty_question_fails(self, client):
        response = client.post("/api/query", json={
            "question": ""
        })
        assert response.status_code == 422

    def test_query_missing_question_fails(self, client):
        response = client.post("/api/query", json={})
        assert response.status_code == 422

    def test_query_success_direct(self, client):
        # A simple greeting should route to DIRECT mode
        response = client.post("/api/query", json={
            "question": "Hello there! How are you?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 0
        assert data["sources"] == []

    def test_query_success_web(self, client):
        # General knowledge should route to WEB mode and return web search results
        response = client.post("/api/query", json={
            "question": "What is the capital city of France?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["sources"]) > 0
        assert any(s["source_type"] == "web" for s in data["sources"])

