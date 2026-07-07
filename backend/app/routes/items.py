"""
Items route — GET /items

Returns all saved items (notes and URLs) in the knowledge base.
"""

import logging
from fastapi import APIRouter

from app.models import ItemsListResponse, ItemResponse
from app import database

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/items",
    response_model=ItemsListResponse,
    summary="List all saved items",
    description="Returns all ingested items (notes and URLs) with metadata, ordered by newest first.",
)
async def get_items():
    """Fetch all items from the knowledge base."""
    items = database.get_all_items()

    return ItemsListResponse(
        items=[ItemResponse(**item) for item in items],
        total=len(items),
    )
