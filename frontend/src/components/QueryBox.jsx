import { useState } from 'react';
import { queryKnowledge } from '../api/client';

/**
 * QueryBox — lets users ask questions over their saved content.
 *
 * Features:
 * - Text input for questions
 * - Submit via button or Enter key
 * - Loading state while processing
 * - Passes result to parent via onResult callback
 *
 * Props:
 * - onResult: callback with the query response { answer, sources }
 */
export default function QueryBox({ onResult, onQueryStart }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    onQueryStart?.(question.trim()); // Let parent know query is starting

    try {
      const result = await queryKnowledge(question.trim());
      onResult?.(result, question.trim());
      setQuestion(''); // Clear input on success
    } catch (err) {
      setError(err.message);
      onResult?.(null, question.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="card query-card" id="query-box">
      <h2 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        Ask a Question
      </h2>
      <p className="card-subtitle">Ask anything about your saved content.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            id="question-input"
            type="text"
            className="form-input"
            placeholder="What would you like to know?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <div className="card-footer">
          <button
            id="query-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Thinking...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}>
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Ask Question
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="status-msg error">{error}</div>
      )}
    </div>
  );
}
