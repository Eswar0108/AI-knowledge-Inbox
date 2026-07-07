"""
Configuration module — loads environment variables using Pydantic Settings.

WHY Pydantic Settings:
- Validates env vars at startup (fail fast if GROQ_API_KEY is missing)
- Type-safe access throughout the app
- Supports .env files automatically
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Groq API key for LLM calls (free tier)
    groq_api_key: str = ""

    # Path to ChromaDB persistent storage
    chroma_db_path: str = "./data/chroma"

    # Path to SQLite database file
    sqlite_db_path: str = "./data/knowledge.db"

    # Frontend URL for CORS (local dev default)
    frontend_url: str = "http://localhost:5173"

    # Embedding model name (runs locally via sentence-transformers)
    embedding_model: str = "all-MiniLM-L6-v2"

    # Groq model to use for answer generation
    llm_model: str = "llama-3.1-8b-instant"

    # Chunking configuration
    chunk_size: int = 512  # characters per chunk
    chunk_overlap: int = 50  # overlap between chunks

    # RAG retrieval settings
    top_k: int = 5  # number of chunks to retrieve

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton instance — import this everywhere
settings = Settings()
