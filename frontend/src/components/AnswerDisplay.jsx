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
 * - question: the query string asked
 * - onReset: callback to ask another question (clears view)
 */
export default function AnswerDisplay({ result, question, onReset }) {
  if (!result) {
    if (question) {
      return (
        <div className="card answer-card" id="answer-display" style={{ position: 'relative' }}>
          <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                <path d="M9 18h6"/>
                <path d="M10 22h4"/>
              </svg>
              Answer
            </div>
            {onReset && (
              <button 
                onClick={onReset} 
                className="btn-icon" 
                style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Cancel Query"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </h2>
          <div className="question-block">
            <h4>QUESTION</h4>
            <p>{question}</p>
          </div>
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--color-primary)' }} />
            <p style={{ marginTop: '16px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Searching knowledge & formulating answer...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="card answer-card" id="answer-display">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
          </svg>
          Answer
        </h2>
        <div className="empty-state">
          <span className="icon">🤔</span>
          <p>Ask a question below to get an AI-powered answer from your saved content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card answer-card" id="answer-display" style={{ position: 'relative' }}>
      <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
          </svg>
          Answer
        </div>
        {onReset && (
          <button 
            onClick={onReset} 
            className="btn-icon" 
            style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Answer"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </h2>

      {/* Render original question if provided */}
      {question && (
        <div className="question-block">
          <h4>QUESTION</h4>
          <p>{question}</p>
        </div>
      )}

      {/* RAG Synthesized Answer */}
      <div className="answer-block">
        <h4>ANSWER</h4>
        <div className="answer-content">
          {result.answer}
        </div>
      </div>

      {/* Cited sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="sources-block">
          <h4>SOURCES ({result.sources.length})</h4>
          <div className="sources-list">
            {result.sources.map((source, index) => {
              const isUrl = source.item_id && source.item_id.startsWith('http');
              return (
                <div key={index} className="source-item">
                  <div className="source-item-header">
                    <div className="source-item-title">
                      <span className="source-index">{index + 1}</span>
                      {isUrl ? (
                        <a 
                          href={source.item_id} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="badge url"
                          style={{textDecoration: 'none'}}
                        >
                          🔗 {source.source_type === 'web' ? 'Web Search' : 'URL'}
                        </a>
                      ) : (
                        <span className="badge note">
                          📝 Note
                        </span>
                      )}
                    </div>
                    <span className="source-score">
                      relevance: {source.source_type === 'web' ? '1.0' : (1 - source.score).toFixed(1)}
                    </span>
                  </div>
                  <p className="source-item-content">
                    {source.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onReset && (
        <div className="card-footer" style={{justifyContent: 'flex-start', marginTop: '16px'}}>
          <button className="btn btn-secondary" onClick={onReset} type="button">
            Ask Another Question
          </button>
        </div>
      )}
    </div>
  );
}
