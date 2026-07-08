"""
RAG orchestrator — updated to orchestrate a Lightweight Multi-Agent pipeline.

INGESTION FLOW (unmodified):
  1. User submits text or URL
  2. If URL → scraper fetches the page content
  3. Chunker splits content into overlapping chunks
  4. Embedder converts chunks into vectors
  5. Vector store saves the vectors + metadata
  6. Database saves the item metadata

QUERY FLOW (updated to Multi-Agent):
  1. User submits a question
  2. RouterAgent decides the route ('LOCAL', 'WEB', or 'DIRECT')
  3. If 'LOCAL' -> RAGRetrieverAgent fetches context from ChromaDB
  4. If 'WEB'   -> WebResearcherAgent searches live DuckDuckGo
  5. If 'DIRECT'-> Direct LLM chat response (greetings, banter)
  6. WriterAgent synthesizes the answer with citations
"""

import logging
from typing import Any

from app.config import settings
from app.services import chunker, embedder, scraper, vector_store, llm
from app.services.agents import RouterAgent, RAGRetrieverAgent, WebResearcherAgent, WriterAgent
from app import database
from app.models import SourceType

logger = logging.getLogger(__name__)


def ingest_content(content: str, source_type: SourceType) -> dict:
    """
    Full ingestion pipeline: process content → chunk → embed → store.
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
    Multi-Agent query orchestrator pipeline:
    Route intent -> Query context (DB or Web) -> Synthesize response.
    """
    logger.info("Starting Multi-Agent query flow: '%s'", question[:100])

    # Step 1: Route the intent
    route_decision = RouterAgent.route(question)

    # Step 2: Handle routing branches
    if route_decision == "DIRECT":
        logger.info("Routing query directly to LLM (DIRECT mode)")
        try:
            client = llm._client
            if client is None:
                raise RuntimeError("LLM client not ready.")

            response = client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful knowledge inbox assistant. Respond to the user's greeting or question directly, politely, and concisely."
                    },
                    {"role": "user", "content": question},
                ],
                temperature=0.5,
                max_tokens=512,
            )
            answer = response.choices[0].message.content
            return {
                "answer": answer,
                "sources": [],
            }
        except Exception as e:
            logger.error("Direct LLM response failed: %s. Falling back to local RAG", str(e))
            route_decision = "LOCAL"

    # Step 3: Retrieval execution
    context_chunks = []
    sources = []

    if route_decision == "LOCAL":
        # RAG Local search
        retrieved_data = RAGRetrieverAgent.retrieve(question)
        for chunk in retrieved_data:
            context_chunks.append({
                "content": chunk["content"],
                "source_type": chunk["source_type"],
            })
            
            source_url = None
            if chunk["source_type"] == "url":
                item_details = database.get_item_by_id(chunk["item_id"])
                if item_details:
                    source_url = item_details.get("source_url")

            sources.append({
                "content": chunk["content"],
                "item_id": source_url if source_url else chunk["item_id"],
                "source_type": chunk["source_type"],
                "score": round(chunk["score"], 4),
            })
            
        if not context_chunks:
            return {
                "answer": "I couldn't find any relevant saved notes or URLs in your inbox to answer this question. Try adding some bookmarks first!",
                "sources": [],
            }

    elif route_decision == "WEB":
        # Web Search Agent
        search_results = WebResearcherAgent.research(question)
        for i, res in enumerate(search_results):
            # Format to match the context expected by WriterAgent and response format
            snippet = res.get("snippet", "")
            url = res.get("url", "")
            title = res.get("title", f"Web Result {i+1}")
            
            context_chunks.append({
                "content": f"{title}: {snippet}",
                "source_type": "web",
            })
            sources.append({
                "content": f"{title} - {snippet}",
                "item_id": url, # Use web link as item_id
                "source_type": SourceType.WEB.value,
                "score": 0.0, # Web results have standard score
            })

        if not context_chunks:
            # Fallback to local if web search fails
            logger.warning("Web search returned no results. Falling back to local search.")
            return query_knowledge(question)

    # Step 4: Synthesize answer
    answer = WriterAgent.synthesize(question, context_chunks, route_decision)

    return {
        "answer": answer,
        "sources": sources,
    }
