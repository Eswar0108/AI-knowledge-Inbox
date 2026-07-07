"""
RAG orchestrator — ties all services together into the retrieval-augmented generation pipeline.

THIS IS THE CORE OF THE APP. Here's the full flow:

INGESTION FLOW (when user adds content):
  1. User submits text or URL
  2. If URL → scraper fetches the page content
  3. Chunker splits content into overlapping chunks
  4. Embedder converts chunks into vectors
  5. Vector store saves the vectors + metadata
  6. Database saves the item metadata

QUERY FLOW (when user asks a question):
  1. User submits a question
  2. Embedder converts the question into a vector
  3. Vector store finds the most similar chunks (top-K)
  4. LLM receives the chunks + question and generates an answer
  5. Response includes the answer + cited source snippets

WHY A SEPARATE ORCHESTRATOR:
- Keeps each service focused on one job (separation of concerns)
- The routes just call the orchestrator — they don't know about chunking/embedding/etc.
- Easy to test each service independently
- Easy to swap components (e.g., switch from ChromaDB to Pinecone)
"""

import logging

from app.services import chunker, embedder, scraper, vector_store, llm
from app import database
from app.models import SourceType

logger = logging.getLogger(__name__)


def ingest_content(content: str, source_type: SourceType) -> dict:
    """
    Full ingestion pipeline: process content → chunk → embed → store.

    Args:
        content: Raw text (for notes) or URL (for urls)
        source_type: SourceType.NOTE or SourceType.URL

    Returns:
        dict with: id, message, chunks_created

    Raises:
        ValueError: If content can't be processed
        ConnectionError: If URL can't be fetched
    """
    source_url = None

    # Step 1: Get the text content
    if source_type == SourceType.URL:
        source_url = content
        logger.info("Ingesting URL: %s", content)
        text = scraper.extract_content_from_url(content)
    else:
        logger.info("Ingesting note (%d chars)", len(content))
        text = content

    # Step 2: Chunk the text
    chunks = chunker.chunk_text(text)
    if not chunks:
        raise ValueError("Content produced no chunks after processing")

    # Step 3: Generate embeddings for all chunks
    embeddings = embedder.get_embeddings(chunks)

    # Step 4: Save to SQLite (metadata)
    item_id = database.insert_item(
        content=text,
        source_type=source_type.value,
        chunk_count=len(chunks),
        source_url=source_url,
    )

    # Step 5: Save to ChromaDB (vectors)
    vector_store.add_chunks(
        item_id=item_id,
        chunks=chunks,
        embeddings=embeddings,
        source_type=source_type.value,
    )

    logger.info("Ingestion complete: item_id=%s, chunks=%d", item_id, len(chunks))

    return {
        "id": item_id,
        "message": f"Successfully ingested {source_type.value} ({len(chunks)} chunks created)",
        "chunks_created": len(chunks),
    }


def query_knowledge(question: str) -> dict:
    """
    Full RAG query pipeline: embed question → search → generate answer.

    Args:
        question: The user's question

    Returns:
        dict with: answer, sources

    Raises:
        RuntimeError: If LLM or vector store isn't initialized
    """
    logger.info("Processing query: '%s'", question[:100])

    # Step 1: Embed the question
    query_embedding = embedder.get_single_embedding(question)

    # Step 2: Search for relevant chunks
    relevant_chunks = vector_store.search(query_embedding)

    if not relevant_chunks:
        return {
            "answer": "I don't have enough saved content to answer this question. Try adding some notes or URLs first!",
            "sources": [],
        }

    # Step 3: Generate answer using LLM with context
    answer = llm.generate_answer(question, relevant_chunks)

    # Step 4: Format sources for the response
    sources = [
        {
            "content": chunk["content"],
            "item_id": chunk["item_id"],
            "source_type": chunk["source_type"],
            "score": round(chunk["score"], 4),
        }
        for chunk in relevant_chunks
    ]

    logger.info("Query processed: %d sources cited", len(sources))

    return {
        "answer": answer,
        "sources": sources,
    }
