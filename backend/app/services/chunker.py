"""
Text chunking service — splits content into smaller pieces for embedding.

HOW IT WORKS:
- Fixed-size chunking with overlap
- Each chunk is ~512 characters with 50 character overlap
- Overlap ensures context isn't lost at chunk boundaries

WHY THIS APPROACH:
- Simple and predictable — easy to debug and understand
- Good baseline that works well for most content
- The overlap prevents cutting sentences mid-thought

WHAT WOULD BE BETTER AT SCALE:
- Recursive splitting (split by paragraphs → sentences → characters)
- Semantic chunking (split at topic boundaries using NLP)
- Token-based chunking (align with LLM token limits)
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


def chunk_text(text: str) -> list[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: The full text content to chunk

    Returns:
        List of text chunks

    Example:
        >>> chunks = chunk_text("A very long article about Python...")
        >>> len(chunks)  # depends on text length
        3
        >>> len(chunks[0]) <= 512
        True
    """
    # Clean up whitespace
    text = text.strip()

    if not text:
        logger.warning("Received empty text for chunking")
        return []

    chunk_size = settings.chunk_size
    chunk_overlap = settings.chunk_overlap

    # If text is shorter than one chunk, return it as-is
    if len(text) <= chunk_size:
        logger.debug("Text fits in single chunk (%d chars)", len(text))
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        # Calculate end position
        end = start + chunk_size

        # If this isn't the last chunk, try to break at a sentence/word boundary
        if end < len(text):
            # Look for the last period, newline, or space within the chunk
            for separator in ['. ', '\n', ' ']:
                last_break = text[start:end].rfind(separator)
                if last_break != -1 and last_break > chunk_size * 0.5:
                    # Found a good break point in the second half of the chunk
                    end = start + last_break + len(separator)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start forward, accounting for overlap
        start = end - chunk_overlap

    logger.info("Chunked %d chars into %d chunks", len(text), len(chunks))
    return chunks
