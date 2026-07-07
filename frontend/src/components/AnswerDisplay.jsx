/**
 * AnswerDisplay — renders the LLM-generated answer with cited sources.
 *
 * Features:
 * - Displays the answer text with left border accent
 * - Lists source snippets with relevance scores
 * - Fade-in animation on new answers
 * - Empty state when no query has been made
 *
 * Props:
 * - result: { answer: string, sources: Array } or null
 */
export default function AnswerDisplay({ result }) {
  if (!result) {
    return (
      <div className="card" id="answer-display">
        <h2 className="card-title">
          <span className="icon">💡</span>
          Answer
        </h2>
        <div className="empty-state">
          <span className="icon">🤔</span>
          <p>Ask a question above to get an AI-powered answer from your saved content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" id="answer-display">
      <h2 className="card-title">
        <span className="icon">💡</span>
        Answer
      </h2>

      <div className="answer-container">
        {/* The LLM answer */}
        <div className="answer-text">
          {result.answer}
        </div>

        {/* Cited sources */}
        {result.sources && result.sources.length > 0 && (
          <div className="sources-section">
            <h3 className="sources-title">
              📎 Sources ({result.sources.length})
            </h3>
            {result.sources.map((source, index) => (
              <div key={index} className="source-card">
                <div className="source-header">
                  <span className="source-label">
                    Source {index + 1} — {source.source_type === 'note' ? '📝 Note' : '🔗 URL'}
                  </span>
                  <span className="source-score">
                    relevance: {(1 - source.score).toFixed(1)}
                  </span>
                </div>
                <p className="source-content">{source.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
