/**
 * API Client — handles all HTTP communication with the backend.
 *
 * WHY a separate API client:
 * - Single source of truth for API URLs
 * - Centralized error handling
 * - Easy to swap base URL for deployment
 * - Components stay clean (no fetch logic)
 */

// In development, Vite proxy handles /api → localhost:8000
// In production, use the deployed backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}/api${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Try to parse error detail from FastAPI
      const errorData = await response.json().catch(() => null);
      const message = errorData?.detail || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to the server. Is the backend running?');
    }
    throw error;
  }
}

/**
 * POST /api/ingest — Add a note or URL to the knowledge base.
 *
 * @param {string} type - 'note' or 'url'
 * @param {string} content - Text content or URL
 * @returns {Promise<{id: string, message: string, chunks_created: number}>}
 */
export async function ingestContent(type, content) {
  return apiRequest('/ingest', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

/**
 * GET /api/items — List all saved items.
 *
 * @returns {Promise<{items: Array, total: number}>}
 */
export async function getItems() {
  return apiRequest('/items');
}

/**
 * POST /api/query — Ask a question over saved content.
 *
 * @param {string} question - The question to ask
 * @returns {Promise<{answer: string, sources: Array}>}
 */
export async function queryKnowledge(question) {
  return apiRequest('/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
