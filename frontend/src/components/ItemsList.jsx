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
    <div className="card" id="items-list">
      <h2 className="card-title">
        <span className="icon">📚</span>
        Saved Items
        {items.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
            ({items.length})
          </span>
        )}
      </h2>

      {loading ? (
        <div className="loading">
          <span className="spinner" />
          Loading items...
        </div>
      ) : error ? (
        <div className="status-message status-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="icon">📭</span>
          <p>No items yet. Add a note or URL above!</p>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className={`item-badge ${item.source_type}`}>
                  {item.source_type === 'note' ? '📝' : '🔗'} {item.source_type}
                </span>
                <span className="item-meta">{formatDate(item.created_at)}</span>
              </div>
              <p className="item-preview">{item.content_preview}</p>
              <div className="item-chunks">{item.chunk_count} chunk{item.chunk_count !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
