"""
Embedding service — converts text into numerical vectors using sentence-transformers.

HOW IT WORKS:
- Loads the 'all-MiniLM-L6-v2' model (~90MB) once at startup
- Converts any text into a 384-dimensional vector (list of 384 numbers)
- Similar texts produce vectors that are close together in vector space
- This is how semantic search works: "find chunks whose meaning is close to the question"

WHY sentence-transformers:
- Runs 100% locally — no API key, no cost, no rate limits
- all-MiniLM-L6-v2 is the best balance of speed vs quality for small models
- Fast enough for real-time embedding (~100ms per batch)

WHY NOT an API (e.g., OpenAI embeddings):
- Costs money per token
- Adds network latency
- Creates external dependency
- For a small app like this, local is strictly better
"""

import logging
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level model instance — loaded once, reused everywhere
_model: SentenceTransformer | None = None


def load_model() -> None:
    """
    Load the embedding model into memory.
    Called once at app startup (in main.py lifespan).
    """
    global _model
    logger.info("Loading embedding model '%s'...", settings.embedding_model)
    _model = SentenceTransformer(settings.embedding_model)
    logger.info("Embedding model loaded successfully (dim=%d)", _model.get_sentence_embedding_dimension())


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts.

    Args:
        texts: List of text strings to embed

    Returns:
        List of embedding vectors (each is a list of 384 floats)

    Raises:
        RuntimeError: If model hasn't been loaded yet
    """
    if _model is None:
        raise RuntimeError("Embedding model not loaded. Call load_model() first.")

    logger.debug("Generating embeddings for %d texts", len(texts))
    # encode() returns numpy arrays, convert to plain lists for ChromaDB
    embeddings = _model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def get_single_embedding(text: str) -> list[float]:
    """Convenience method to embed a single text string."""
    return get_embeddings([text])[0]
