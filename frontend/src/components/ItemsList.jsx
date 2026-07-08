import { useState, useEffect } from 'react';
import { getItems } from '../api/client';

/**
 * ItemsList — displays all saved items (notes and URLs) from the knowledge base.
 *
 * Features:
 * - Auto-fetches items on mount
 * - Refreshes when refreshTrigger prop changes
 * - Shows source type badge (note/url)
 * - Shows content preview and chunk count
 * - Empty state when no items exist
 *
 * Props:
 * - refreshTrigger: increment this to trigger a re-fetch
 */
export default function ItemsList({ refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format ISO date string to a human-readable relative time.
   */
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div id="items-list-view">
      {loading ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <span className="spinner" style={{ marginRight: '8px' }} />
          Loading items...
        </div>
      ) : error ? (
        <div className="status-msg error">{error}</div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="icon">📭</span>
            <p>No items yet. Add a note or URL on the dashboard!</p>
          </div>
        </div>
      ) : (
        <div className="items-list-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          marginTop: '12px'
        }}>
          {items.map((item) => (
            <div key={item.id} className="card item-card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              height: '100%',
              minHeight: '180px'
            }}>
              <div className="item-card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className={`badge ${item.source_type}`}>
                  {item.source_type === 'note' ? 'Note' : 'URL'}
                </span>
                <span className="item-card-time" style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)'
                }}>
                  {formatDate(item.created_at)}
                </span>
              </div>
              
              <p className="item-card-preview" style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}>
                {item.content_preview}
              </p>
              
              <div className="item-card-footer" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <span className="item-card-chunks" style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500
                }}>
                  {item.chunk_count} chunk{item.chunk_count !== 1 ? 's' : ''}
                </span>
                {item.source_url && (
                  <a 
                    href={item.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    Visit link
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
