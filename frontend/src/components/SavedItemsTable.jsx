import React, { useState } from 'react';

/**
 * SavedItemsTable — displays a clean, compact tabular view of saved notes/URLs.
 * Matches the "Your Items" dashboard card in the design mockup.
 *
 * Props:
 * - items: list of saved items
 * - limit: max number of items to show (e.g. 5 for dashboard)
 * - onViewAll: callback triggered when "View all items" link is clicked
 */
export default function SavedItemsTable({ items, limit = 5, onViewAll }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'note' | 'url'
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Format ISO date string to a clean human-readable date.
   * Matches the mockup's date format (e.g., "May 21, 2025 11:20 AM").
   */
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return 'Recent';
    }
  };

  // Filter items locally based on selected tab and search query
  const filteredItems = items.filter(item => {
    const matchesTab = filterTab === 'all' || item.source_type === filterTab;
    const matchesSearch = item.content_preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const displayedItems = filteredItems.slice(0, limit);

  return (
    <div className="card saved-items-card" id="saved-items-table">
      {/* Title Header */}
      <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          Your Items
        </h2>
      </div>

      {/* Filter and Search Panel matching mock-up */}
      <div className="table-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Left Side: Filter Tabs */}
        <div className="control-tabs" style={{ display: 'flex', gap: '8px' }}>
          {['all', 'note', 'url'].map(tab => (
            <button
              key={tab}
              className={`btn btn-secondary`}
              onClick={() => setFilterTab(tab)}
              type="button"
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filterTab === tab ? 'var(--color-primary-light)' : 'transparent',
                color: filterTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderColor: filterTab === tab ? 'var(--color-primary)' : 'var(--color-border)',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {tab === 'all' ? 'All' : tab === 'note' ? 'Notes' : 'URLs'}
            </button>
          ))}
        </div>

        {/* Right Side: Search input & filter icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, maxWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.5" style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>
          <button className="btn-icon" title="Filters" type="button" style={{ border: '1px solid var(--color-border)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/>
              <line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/>
              <line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/>
              <line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </button>
        </div>
      </div>

      {displayedItems.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <span className="icon">📭</span>
          <p>No matching items found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th align="left">TITLE</th>
                <th align="left">TYPE</th>
                <th align="left">ADDED AT</th>
                <th align="center"></th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((item) => (
                <tr key={item.id}>
                  <td className="col-title" title={item.content_preview}>
                    {item.content_preview}
                  </td>
                  <td>
                    <span className={`badge ${item.source_type}`}>
                      {item.source_type === 'note' ? 'Note' : 'URL'}
                    </span>
                  </td>
                  <td className="col-date">
                    {formatDate(item.created_at)}
                  </td>
                  <td align="center">
                    <button className="btn-icon" title="Options" type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length > limit && (
            <div className="table-footer">
              <button className="link-btn" onClick={onViewAll} type="button">
                View all items →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
