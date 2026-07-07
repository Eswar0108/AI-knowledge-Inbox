"""
Ingest route — POST /ingest

Handles adding new content (notes or URLs) to the knowledge base.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.models import IngestRequest, IngestResponse
from app.services import rag

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/ingest",
    response_model=IngestResponse,
    summary="Add content to the knowledge base",
    description="Ingest a text note or URL. The content will be chunked, embedded, and stored for semantic search.",
    responses={
        400: {"description": "Invalid content or failed to process"},
        500: {"description": "Internal server error"},
    },
)
async def ingest(request: IngestRequest):
    """
    Ingest content into the knowledge base.

    - **type**: 'note' for plain text, 'url' for web pages
    - **content**: The text content or URL to ingest
    """
    try:
        result = rag.ingest_content(
            content=request.content,
            source_type=request.type,
        )
        return IngestResponse(**result)

    except ValueError as e:
        # Content processing errors (empty content, bad URL content)
        logger.warning("Ingestion validation error: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))

    except ConnectionError as e:
        # URL fetching errors
        logger.warning("URL fetch error: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error("Unexpected ingestion error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to ingest content. Please try again.")
