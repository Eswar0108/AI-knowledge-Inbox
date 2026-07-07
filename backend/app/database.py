"""
SQLite database operations for storing item metadata.

WHY SQLite:
- Zero config, file-based — no database server to run
- Perfect for single-user apps
- Fast enough for thousands of items
- Easy to inspect with any SQLite browser

WHAT IT STORES:
- Item metadata (id, content preview, source type, timestamps)
- NOT the vector embeddings — those go in ChromaDB
"""

import sqlite3
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)


def get_db_path() -> str:
    """Get the SQLite database path, creating parent directories if needed."""
    db_path = Path(settings.sqlite_db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return str(db_path)


def get_connection() -> sqlite3.Connection:
    """Create a new database connection with row factory."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row  # Access columns by name
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    return conn


def init_db() -> None:
    """Create the items table if it doesn't exist."""
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                content_preview TEXT NOT NULL,
                source_type TEXT NOT NULL CHECK(source_type IN ('note', 'url')),
                source_url TEXT,
                created_at TEXT NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.commit()
        logger.info("Database initialized successfully at %s", get_db_path())
    finally:
        conn.close()


def insert_item(
    content: str,
    source_type: str,
    chunk_count: int,
    source_url: str | None = None,
) -> str:
    """
    Insert a new item and return its ID.

    Args:
        content: Full text content
        source_type: 'note' or 'url'
        chunk_count: Number of chunks created from this content
        source_url: Original URL if source_type is 'url'

    Returns:
        The generated item ID
    """
    item_id = str(uuid.uuid4())
    content_preview = content[:200].strip()
    created_at = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO items (id, content, content_preview, source_type, source_url, created_at, chunk_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (item_id, content, content_preview, source_type, source_url, created_at, chunk_count),
        )
        conn.commit()
        logger.info("Inserted item %s (type=%s, chunks=%d)", item_id, source_type, chunk_count)
        return item_id
    finally:
        conn.close()


def get_all_items() -> list[dict]:
    """Fetch all items ordered by creation date (newest first)."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "SELECT id, content_preview, source_type, source_url, created_at, chunk_count "
            "FROM items ORDER BY created_at DESC"
        )
        items = [dict(row) for row in cursor.fetchall()]
        logger.debug("Fetched %d items", len(items))
        return items
    finally:
        conn.close()


def get_item_by_id(item_id: str) -> dict | None:
    """Fetch a single item by ID."""
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
