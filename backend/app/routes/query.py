"""
Query route — POST /query

Handles semantic search + RAG answer generation.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.models import QueryRequest, QueryResponse, SourceSnippet
from app.services import rag

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Ask a question over saved content",
    description="Ask a natural language question. The system will search for relevant chunks, "
                "pass them to an LLM, and return an answer with cited sources.",
    responses={
        400: {"description": "Invalid question"},
        503: {"description": "LLM service unavailable"},
    },
)
async def query(request: QueryRequest):
    """
    Query the knowledge base using RAG.

    - **question**: Natural language question about your saved content
    """
    try:
        result = rag.query_knowledge(question=request.question)

        return QueryResponse(
            answer=result["answer"],
            sources=[SourceSnippet(**s) for s in result["sources"]],
        )

    except RuntimeError as e:
        # LLM or vector store not initialized
        logger.error("Service unavailable: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        logger.error("Unexpected query error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process query. Please try again.")
