# AI Knowledge Inbox

A minimal, production-style RAG (Retrieval-Augmented Generation) web app. Save notes and URLs, then ask questions over your saved content and get AI-powered answers with cited sources.

**Live Demo**: _[Add your deployed URL here after deployment]_

---

## Quick Start

### Prerequisites

- Python 3.10+ 
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (no credit card needed)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  (Add Notes/URLs, Ask Questions,    │
│   View Answers with Citations)      │
└──────────────┬──────────────────────┘
               │ HTTP (JSON)
┌──────────────▼──────────────────────┐
│          FastAPI Backend            │
│                                     │
│  POST /api/ingest  → Ingest content │
│  GET  /api/items   → List items     │
│  POST /api/query   → RAG pipeline   │
└──┬──────────┬───────────────┬───────┘
   │          │               │
   ▼          ▼               ▼
SQLite    ChromaDB         Groq API
(metadata) (vectors)    (LLM answers)
```

### Pipeline & Multi-Agent Architecture

**Ingestion Flow** (when you add content):
1. Text input or scraped URL → **Chunker** (fixed-size with sentence-boundary adjustment) → **Embedder** (sentence-transformers) → **ChromaDB** (vectors) & **SQLite** (metadata).

**Query Flow** (using our Custom Multi-Agent System):
1. **User Question** is received by the backend.
2. **Router Agent** analyzes the query intent using zero-shot classification on Groq:
   - `DIRECT`: Greeting/conversational chatter → Bypasses search, replies directly.
   - `LOCAL`: Inquiry about saved database bookmarks/notes → Triggers **RAG Retriever Agent**.
   - `WEB`: General knowledge or queries requiring search → Triggers **Web Researcher Agent**.
3. **RAG Retriever Agent** fetches matching context vector embeddings from ChromaDB.
4. **Web Researcher Agent** runs a real-time key-less DuckDuckGo search and extracts HTML content snippets for general queries.
5. **Writer/Synthesis Agent** compiles retrieved evidence, builds a context-constrained prompt, and generates the final answer on Groq citing sources (with support for both local file IDs and direct web hyperlinks).

---

## Design Decisions & Tradeoffs

### Chunking Strategy: Fixed-Size with Overlap (512 chars, 50 overlap)

**Why this approach:**
- Simple, predictable, and easy to debug
- Overlap prevents losing context at chunk boundaries
- Smart break-point detection tries to split at sentence/paragraph boundaries
- Good baseline that works for most content types

**Tradeoff:** Fixed-size chunks can cut across topic boundaries. At scale, I'd switch to recursive splitting (by paragraphs → sentences → characters) or semantic chunking (detect topic changes using NLP).

### Vector Store: ChromaDB

**Why ChromaDB:**
- Runs in-process — no separate database server needed
- Persistent storage to disk (survives restarts)
- Simple API for add/query operations
- Handles cosine similarity search efficiently for thousands of documents

**Tradeoff:** ChromaDB is single-node and in-process. It won't scale to millions of vectors or handle concurrent writes well. In production, I'd use a managed vector database (Pinecone, Weaviate, or Qdrant) or PostgreSQL with pgvector.

### LLM: Groq (llama-3.1-8b-instant)

**Why Groq free tier:**
- No cost, no credit card required
- Extremely fast inference (custom LPU hardware)
- llama-3.1-8b is capable enough for QA tasks
- Simple API compatible with OpenAI-style interface

**Tradeoff:** Free tier has rate limits (~30 requests/minute). For production, I'd use a paid tier or switch to OpenAI GPT-4o-mini for better answer quality.

### Embeddings: sentence-transformers (all-MiniLM-L6-v2, local)

**Why local embeddings:**
- No API key needed, no cost, no rate limits
- Fast enough for real-time embedding (~100ms per batch)
- 384-dimensional vectors — good balance of quality vs size

**Tradeoff:** Uses ~200MB RAM for the model. At scale with millions of documents, I'd switch to API-based embeddings (OpenAI text-embedding-3-small) and batch processing.

### Storage: SQLite

**Why SQLite:**
- Zero configuration, file-based database
- Perfect for single-user applications
- Fast reads for the item listing endpoint

**Tradeoff:** SQLite doesn't support concurrent writes well and is file-based (not suitable for multi-server deployment). In production, I'd use PostgreSQL.

---

## What Breaks at Scale

| Component | Limit | Production Solution |
|-----------|-------|-------------------|
| ChromaDB | Single-node, in-memory index | Pinecone / Weaviate / pgvector |
| SQLite | No concurrent writes | PostgreSQL |
| sentence-transformers | 200MB RAM per instance | API-based embeddings + batch queue |
| Fixed chunking | Loses cross-topic context | Recursive / semantic chunking |
| Groq free tier | 30 req/min rate limit | Paid API tier / OpenAI |
| Render free tier | Ephemeral storage, auto-sleep | Paid tier with persistent disk |

## Production Changes

If deploying this for real users, I would add:

1. **Authentication** — JWT-based auth with user isolation
2. **Async ingestion** — Task queue (Celery + Redis) for background processing of URLs
3. **Persistent storage** — PostgreSQL + pgvector (vectors + metadata in one DB)
4. **Caching** — Redis cache for repeated queries
5. **Rate limiting** — Per-user rate limits on ingestion and queries
6. **Monitoring** — Structured logging → ELK stack, Prometheus metrics
7. **CI/CD** — GitHub Actions for testing + auto-deploy
8. **Input sanitization** — Stricter validation, content-type checks for URLs

---

## API Reference

### `POST /api/ingest`

Add content to the knowledge base.

**Request:**
```json
{
  "type": "note",
  "content": "Python is a high-level programming language..."
}
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "message": "Successfully ingested note (3 chunks created)",
  "chunks_created": 3
}
```

### `GET /api/items`

List all saved items.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "content_preview": "First 200 characters...",
      "source_type": "note",
      "source_url": null,
      "created_at": "2024-01-01T00:00:00Z",
      "chunk_count": 3
    }
  ],
  "total": 1
}
```

### `POST /api/query`

Ask a question over saved content (RAG pipeline).

**Request:**
```json
{
  "question": "What is Python used for?"
}
```

**Response (200):**
```json
{
  "answer": "Based on the saved content, Python is used for...",
  "sources": [
    {
      "content": "The relevant chunk text...",
      "item_id": "uuid",
      "source_type": "note",
      "score": 0.234
    }
  ]
}
```

---

## Tech Stack

| Layer | Technology | Free? |
|-------|-----------|-------|
| Backend | FastAPI (Python) | ✅ |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | ✅ Local |
| Vector Store | ChromaDB | ✅ Local |
| LLM | Groq API (llama-3.1-8b-instant) | ✅ Free tier |
| Metadata DB | SQLite | ✅ Local |
| Frontend | React + Vite | ✅ |
| Deploy Backend | Render.com | ✅ Free tier |
| Deploy Frontend | Vercel | ✅ Free tier |

---

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI entry point + lifespan
│   ├── Dockerfile              # Render deployment
│   ├── app/
│   │   ├── config.py           # Environment config (Pydantic Settings)
│   │   ├── models.py           # Request/response schemas
│   │   ├── database.py         # SQLite operations
│   │   ├── routes/
│   │   │   ├── ingest.py       # POST /api/ingest
│   │   │   ├── items.py        # GET /api/items
│   │   │   └── query.py        # POST /api/query
│   │   └── services/
│   │       ├── chunker.py      # Text chunking (512 char + overlap)
│   │       ├── embedder.py     # sentence-transformers wrapper
│   │       ├── scraper.py      # URL content extraction
│   │       ├── vector_store.py # ChromaDB operations
│   │       ├── llm.py          # Groq LLM client
│   │       └── rag.py          # RAG orchestrator
│   └── tests/
│       └── test_api.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main layout
│   │   ├── api/client.js       # API helper functions
│   │   └── components/
│   │       ├── IngestForm.jsx   # Add note/URL
│   │       ├── ItemsList.jsx    # Display saved items
│   │       ├── QueryBox.jsx     # Ask questions
│   │       └── AnswerDisplay.jsx # Show answers + citations
│   └── vercel.json             # Vercel deployment config
└── README.md
```
