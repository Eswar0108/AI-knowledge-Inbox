import { useState } from 'react';
import { ingestContent } from '../api/client';

/**
 * IngestForm — lets users add notes or URLs to the knowledge base.
 *
 * Features:
 * - Toggle between Note and URL mode
 * - Input validation
 * - Loading state while ingesting
 * - Success/error feedback
 *
 * Props:
 * - onIngestSuccess: callback fired after successful ingestion (refreshes items list)
 */
export default function IngestForm({ onIngestSuccess }) {
  const [type, setType] = useState('note');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Please enter some content.' });
      return;
    }

    if (type === 'url' && !content.startsWith('http')) {
      setStatus({ type: 'error', message: 'Please enter a valid URL starting with http:// or https://' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const result = await ingestContent(type, content.trim());
      setStatus({
        type: 'success',
        message: `${result.message}`,
      });
      setContent(''); // Clear input on success
      onIngestSuccess?.(); // Refresh the items list
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to ingest content.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" id="ingest-form">
      <h2 className="card-title">
        <span className="icon">📥</span>
        Add Content
      </h2>

      {/* Note / URL Toggle */}
      <div className="toggle-group">
        <button
          id="toggle-note"
          className={`toggle-btn ${type === 'note' ? 'active' : ''}`}
          onClick={() => { setType('note'); setStatus(null); }}
          type="button"
        >
          📝 Note
        </button>
        <button
          id="toggle-url"
          className={`toggle-btn ${type === 'url' ? 'active' : ''}`}
          onClick={() => { setType('url'); setStatus(null); }}
          type="button"
        >
          🔗 URL
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {type === 'note' ? (
          <div className="form-group">
            <label htmlFor="note-input" className="form-label">Your note</label>
            <textarea
              id="note-input"
              className="form-textarea"
              placeholder="Type or paste your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="url-input" className="form-label">URL to save</label>
            <input
              id="url-input"
              type="url"
              className="form-input"
              placeholder="https://example.com/article"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <button
          id="ingest-submit"
          type="submit"
          className="btn btn-primary"
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            `Save ${type === 'note' ? 'Note' : 'URL'}`
          )}
        </button>
      </form>

      {status && (
        <div className={`status-message status-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
