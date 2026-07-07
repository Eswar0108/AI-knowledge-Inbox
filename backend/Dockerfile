# --- Backend ---
# Dockerfile to deploy the FastAPI backend on Render.com (free tier)
#
# HOW IT WORKS:
# 1. Starts from a slim Python 3.11 image
# 2. Installs dependencies
# 3. Pre-downloads the embedding model (~90MB) at BUILD time
#    (so it's baked into the image and doesn't download on every cold start)
# 4. Runs uvicorn on port 10000 (Render's default)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Pre-download the sentence-transformers model at build time
# This avoids downloading 90MB on every cold start
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Create data directory for SQLite + ChromaDB
RUN mkdir -p /app/data

# Expose the port Render expects
EXPOSE 10000

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
