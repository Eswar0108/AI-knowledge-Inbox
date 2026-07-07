"""
Pydantic models for API request/response validation.

WHY Pydantic models:
- Auto-validates incoming requests (returns 422 with clear errors if invalid)
- Generates OpenAPI/Swagger docs automatically
- Serves as documentation for your API contract
"""

from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# --- Enums ---

class SourceType(str, Enum):
    """Type of content source."""
    NOTE = "note"
    URL = "url"


# --- Request Models ---

class IngestRequest(BaseModel):
    """Request body for POST /ingest."""
    type: SourceType = Field(..., description="Type of content: 'note' or 'url'")
    content: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Text content for notes, or URL string for urls"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"type": "note", "content": "Python is a programming language."},
                {"type": "url", "content": "https://example.com/article"},
            ]
        }
    }


class QueryRequest(BaseModel):
    """Request body for POST /query."""
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The question to ask over your saved content"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"question": "What is Python used for?"},
            ]
        }
    }


# --- Response Models ---

class IngestResponse(BaseModel):
    """Response for POST /ingest."""
    id: str = Field(..., description="Unique ID of the ingested item")
    message: str = Field(..., description="Success message")
    chunks_created: int = Field(..., description="Number of text chunks created")


class SourceSnippet(BaseModel):
    """A source chunk cited in the answer."""
    content: str = Field(..., description="The text snippet used as context")
    item_id: str = Field(..., description="ID of the source item")
    source_type: SourceType = Field(..., description="Whether this came from a note or URL")
    score: float = Field(..., description="Relevance score (lower = more relevant)")


class QueryResponse(BaseModel):
    """Response for POST /query."""
    answer: str = Field(..., description="LLM-generated answer")
    sources: list[SourceSnippet] = Field(
        default_factory=list,
        description="Source snippets cited in the answer"
    )


class ItemResponse(BaseModel):
    """Single item in the GET /items response."""
    id: str
    content_preview: str = Field(..., description="First ~200 chars of content")
    source_type: SourceType
    source_url: str | None = Field(None, description="Original URL if source was a URL")
    created_at: str
    chunk_count: int


class ItemsListResponse(BaseModel):
    """Response for GET /items."""
    items: list[ItemResponse]
    total: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
