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
export default function IngestForm({ onIngestSuccess, fixedType }) {
  const [type, setType] = useState(fixedType || 'note');
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

  const isFixed = !!fixedType;

  return (
    <div className="card" id={isFixed ? `ingest-${fixedType}` : 'ingest-form'}>
      {/* Dynamic Header matching mock-up */}
      {fixedType === 'note' ? (
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          Add Note
        </h2>
      ) : fixedType === 'url' ? (
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-success)'}}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Add URL
        </h2>
      ) : (
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          Add Content
        </h2>
      )}

      {isFixed && (
        <p className="card-subtitle">
          {fixedType === 'note' 
            ? 'Save your thoughts, ideas, or any text content.' 
            : 'Save and index any webpage content.'}
        </p>
      )}

      {/* Render Note / URL Toggle ONLY when not fixed */}
      {!isFixed && (
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
      )}

      <form onSubmit={handleSubmit}>
        {type === 'note' ? (
          <div className="form-group">
            {!isFixed && <label htmlFor="note-input" className="form-label">Your note</label>}
            <textarea
              id="note-input"
              className="form-textarea"
              placeholder="Write something..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              style={{ height: isFixed ? '110px' : '90px' }}
            />
          </div>
        ) : (
          <div className="form-group">
            {!isFixed && <label htmlFor="url-input" className="form-label">URL to save</label>}
            <input
              id="url-input"
              type="url"
              className="form-input"
              placeholder="https://example.com/article"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              style={{ marginTop: isFixed ? '30px' : '0px', marginBottom: isFixed ? '30px' : '0px' }}
            />
          </div>
        )}

        <div className="card-footer">
          <button
            id="ingest-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !content.trim()}
            style={{
              backgroundColor: type === 'url' && isFixed ? 'var(--color-success)' : 'var(--color-primary)',
              gap: '6px'
            }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Processing...
              </>
            ) : (
              <>
                {type === 'note' ? 'Save Note' : 'Save URL'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
