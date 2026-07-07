"""
Vector store service — stores and searches text chunks using ChromaDB.

HOW IT WORKS:
- ChromaDB stores chunks as vectors (embeddings) with metadata
- When you search, it finds the chunks whose vectors are closest to the query vector
- This is "semantic search" — it finds meaning-similar content, not just keyword matches

WHY ChromaDB:
- Runs in-process (no separate server to manage)
- Persistent storage to disk (survives restarts)
- Simple API: add, query, delete
- Good enough for thousands of items

WHAT WOULD BE BETTER AT SCALE:
- Pinecone, Weaviate, or Qdrant (managed vector databases)
- pgvector (PostgreSQL extension — vectors in your existing DB)
- These handle millions of vectors, replication, and concurrent access
"""

import logging
from pathlib import Path

import chromadb

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level ChromaDB client
_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None

COLLECTION_NAME = "knowledge_chunks"


def init_vector_store() -> None:
    """
    Initialize ChromaDB client and collection.
    Called once at app startup.
    """
    global _client, _collection

    db_path = Path(settings.chroma_db_path)
    db_path.mkdir(parents=True, exist_ok=True)

    logger.info("Initializing ChromaDB at %s", db_path)
    _client = chromadb.PersistentClient(path=str(db_path))

    # get_or_create_collection: creates if new, returns existing if already there
    _collection = _client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}  # Use cosine similarity for distance
    )
    logger.info("ChromaDB collection '%s' ready (%d documents)", COLLECTION_NAME, _collection.count())


def add_chunks(
    item_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    source_type: str,
) -> int:
    """
    Store text chunks with their embeddings in ChromaDB.

    Args:
        item_id: The parent item's ID (links chunks back to the source)
        chunks: List of text chunks
        embeddings: Pre-computed embeddings for each chunk
        source_type: 'note' or 'url'

    Returns:
        Number of chunks stored
    """
    if _collection is None:
        raise RuntimeError("Vector store not initialized. Call init_vector_store() first.")

    if not chunks:
        logger.warning("No chunks to add for item %s", item_id)
        return 0

    # Generate unique IDs for each chunk: item_id + chunk index
    chunk_ids = [f"{item_id}_chunk_{i}" for i in range(len(chunks))]

    # Metadata for each chunk — used for filtering and display
    metadatas = [
        {"item_id": item_id, "source_type": source_type, "chunk_index": i}
        for i in range(len(chunks))
    ]

    _collection.add(
        ids=chunk_ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    logger.info("Added %d chunks for item %s to vector store", len(chunks), item_id)
    return len(chunks)


def search(query_embedding: list[float], top_k: int | None = None) -> list[dict]:
    """
    Find the most similar chunks to a query embedding.

    Args:
        query_embedding: The embedding vector of the question
        top_k: Number of results to return (defaults to settings.top_k)

    Returns:
        List of dicts with keys: content, item_id, source_type, score
    """
    if _collection is None:
        raise RuntimeError("Vector store not initialized. Call init_vector_store() first.")

    if top_k is None:
        top_k = settings.top_k

    # Don't try to retrieve more results than exist
    count = _collection.count()
    if count == 0:
        logger.warning("Vector store is empty — no chunks to search")
        return []

    actual_top_k = min(top_k, count)

    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_top_k,
        include=["documents", "metadatas", "distances"],
    )

    # Unpack ChromaDB's nested response format
    chunks = []
    for i in range(len(results["ids"][0])):
        chunks.append({
            "content": results["documents"][0][i],
            "item_id": results["metadatas"][0][i]["item_id"],
            "source_type": results["metadatas"][0][i]["source_type"],
            "score": results["distances"][0][i],  # Lower = more similar (cosine distance)
        })

    logger.info("Found %d relevant chunks (top_k=%d)", len(chunks), actual_top_k)
    return chunks
