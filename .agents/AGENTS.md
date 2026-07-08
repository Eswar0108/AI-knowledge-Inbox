# Project Rules & Guidelines — AI Knowledge Inbox

This file contains Workspace Customization Rules. Any agent pair programming in this workspace must adhere to these guidelines.

## Tech Stack & Architecture
- **Backend**: FastAPI (Python 3.10+). Follow standard route-service-orchestrator pattern.
  - Avoid putting business logic in routes. Routes should only handle requests, invoke orchestrators, log, and raise HTTP exceptions.
  - Core orchestrator resides in [app/services/rag.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/services/rag.py).
- **Frontend**: React + Vite (Vanilla CSS).
  - Use custom CSS variables (design tokens) defined in [App.css](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/frontend/src/App.css) for consistent styling.
  - Maintain a clean, professional, responsive dark theme ("clarity over beauty").
- **Vector Store**: ChromaDB (in-process client). Type globals as `typing.Any` to avoid factory function resolution crashes at runtime.
- **Embeddings**: Local `sentence-transformers` (`all-MiniLM-L6-v2`). Do not replace this with paid API calls unless requested.
- **LLM**: Groq API (`llama-3.1-8b-instant`). Keep temperature low (0.3) for factual correctness in RAG context.

## Coding Style & Standards
1. **Separation of Concerns**: Do not create generic "god" files. Keep components small, focused, and well-typed.
2. **Type Hints**: Use Python 3.10+ style typing throughout the backend.
3. **Structured Logging**: Log operations using Python's `logging` library. Silence noisy third-party libraries (`chromadb`, `sentence_transformers`, `httpx`).
4. **Environment Variables**: Load all custom environment variables through [app/config.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/app/config.py) using Pydantic Settings. Always set `extra = "ignore"` in `model_config` to prevent crash-on-startup.
5. **No Placeholders**: Never include empty placeholders or broken links. Use fully realized logic.

## Testing Guidelines
- When adding new endpoints or editing models, update [tests/test_api.py](file:///Users/tejeswarreddy/Downloads/python/AI%20knowledge%20Inbox/backend/tests/test_api.py).
- Run tests using `python -m pytest tests/ -v`.
- Use the module-scoped `client` fixture that starts up the lifespan manager (loads database, model, and vector store) to avoid "model not loaded" errors.
