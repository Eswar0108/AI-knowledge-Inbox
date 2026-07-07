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
export default function QueryBox({ onResult }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await queryKnowledge(question.trim());
      onResult?.(result);
    } catch (err) {
      setError(err.message);
      onResult?.(null);
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
    <div className="card" id="query-box">
      <h2 className="card-title">
        <span className="icon">🔍</span>
        Ask a Question
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="query-input-group">
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
              'Ask'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="status-message status-error">{error}</div>
      )}
    </div>
  );
}
