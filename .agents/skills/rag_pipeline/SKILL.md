---
name: rag_pipeline
description: Build, debug, or extend the RAG pipeline or backend services for the AI Knowledge Inbox.
---

# RAG Pipeline Modification Skill

Use this skill when modifying, extending, or troubleshooting the RAG pipeline (chunking, local embeddings, vector storage, web scraping, or LLM response generation).

## Core Components Reference

- **Scraper**: Uses `trafilatura` inside [app/services/scraper.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/scraper.py) to extract page content.
- **Chunker**: Splits text by sentence/paragraph markers within a length of 512 chars and 50 char overlap. See [app/services/chunker.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/chunker.py).
- **Embedder**: Local `sentence-transformers` loaded via [app/services/embedder.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/embedder.py).
- **Vector Store**: ChromaDB wrapper in [app/services/vector_store.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/vector_store.py).
- **LLM**: Calls Groq SDK using the `llama-3.1-8b-instant` model in [app/services/llm.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/llm.py).

## Common Tasks & Recipes

### 1. Changing the Chunking Strategy
If the user wants to adjust chunk size or overlap, change the defaults in `Settings` class in [app/config.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/config.py):
```python
chunk_size: int = 512
chunk_overlap: int = 50
```
If recursive or semantic splitting is requested, update `chunk_text()` in [app/services/chunker.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/chunker.py).

### 2. Upgrading the Local Embeddings Model
To use a larger/different local model:
1. Update `embedding_model` default value in [app/config.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/config.py).
2. Update the pre-download command in [Dockerfile](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/Dockerfile#L27) to ensure Render builds bake the new model.
3. Note: Changing the model means ChromaDB must be re-indexed (delete `/data/chroma` to clear the old-dimension vectors).

### 3. Debugging Retrieval Failures
If RAG queries return poor results:
- Check retrieved cosine similarity scores in standard logs.
- Adjust `top_k` value in settings.
- Verify prompt template structure in [app/services/llm.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/llm.py#L52).
