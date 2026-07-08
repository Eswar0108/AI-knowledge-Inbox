"""
AI Knowledge Inbox — Main Application Entry Point

This is where everything comes together:
1. FastAPI app is created with CORS middleware
2. All route modules are mounted
3. Startup events initialize the embedding model, vector store, and database
4. Structured logging is configured

RUN LOCALLY:
    cd backend
    uvicorn main:app --reload --port 8000

Then open http://localhost:8000/docs for the interactive API docs.
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app import database
from app.services import embedder, vector_store, llm
from app.routes import ingest, items, query


# --- Structured Logging Setup ---

def setup_logging() -> None:
    """
    Configure structured logging for the application.

    WHY structured logging:
    - Makes debugging easier (you can search/filter logs)
    - Shows timestamps, log levels, and which module generated the log
    - In production, these logs can be sent to monitoring tools
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    # Quiet down noisy third-party loggers
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


# --- Application Lifespan ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle for the app.

    ON STARTUP:
    - Initialize the database tables
    - Load the embedding model into memory
    - Connect to ChromaDB
    - Initialize the Groq LLM client

    ON SHUTDOWN:
    - Cleanup (Python handles this automatically for our case)
    """
    logger = logging.getLogger(__name__)

    logger.info("🚀 Starting AI Knowledge Inbox...")

    # 1. Initialize SQLite database
    database.init_db()
    logger.info("✅ Database initialized")

    # 2. Load embedding model (this takes a few seconds on first run)
    embedder.load_model()
    logger.info("✅ Embedding model loaded")

    # 3. Initialize ChromaDB vector store
    vector_store.init_vector_store()
    logger.info("✅ Vector store initialized")

    # 4. Initialize Groq LLM client
    llm.init_llm()
    logger.info("✅ LLM client initialized")

    # 5. Seed database with professional documents if empty
    try:
        items = database.get_all_items()
        if not items:
            logger.info("Database is empty. Seeding professional default notes...")
            from app.models import SourceType
            from app.services import rag
            seed_items = [
                {
                    "content": "Design Patterns: Route-Service-Orchestrator Pattern. The Route-Service-Orchestrator pattern isolates request handling, business logic, and coordination layers. Routes validate requests and map endpoints; Services execute specific tasks (like vector searches or scraping); Orchestrators coordinate multiple services to complete high-level actions (like RAG pipelines).",
                    "type": "note"
                },
                {
                    "content": "ChromaDB Persistent Client in Python. ChromaDB runs in-process using sqlite3 for local persistence. When typing ChromaDB persistent clients in Python 3.10+, type variables as typing.Any to prevent TypeErrors at runtime, as chromadb.PersistentClient is evaluated as a factory function rather than a standard type.",
                    "type": "note"
                },
                {
                    "content": "Redis Persistence Configurations. Redis provides two main persistence mechanisms: RDB (Redis Database) which creates point-in-time snapshots of the dataset at specified intervals, and AOF (Append Only File) which logs every write operation received by the server to be played back at startup. For high durability, combining both RDB and AOF is recommended.",
                    "type": "note"
                }
            ]
            for item in seed_items:
                rag.ingest_content(item["content"], SourceType(item["type"]))
            logger.info("✅ Database seeded successfully with professional data")
    except Exception as e:
        logger.error("Failed to seed database: %s", str(e))

    logger.info("🎉 AI Knowledge Inbox is ready!")
    logger.info("📖 API docs available at http://localhost:8000/docs")

    yield  # App is running

    logger.info("👋 Shutting down AI Knowledge Inbox...")


# --- Create FastAPI App ---

setup_logging()

app = FastAPI(
    title="AI Knowledge Inbox",
    description=(
        "A minimal RAG-powered knowledge base. "
        "Save notes and URLs, then ask questions over your saved content."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
# Allows the React frontend to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mount Routes ---
app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(items.router, prefix="/api", tags=["Items"])
app.include_router(query.router, prefix="/api", tags=["Query"])


# --- Health Check ---
@app.get("/health", tags=["System"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "service": "ai-knowledge-inbox"}
