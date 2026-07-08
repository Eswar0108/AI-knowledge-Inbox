import React from 'react';

/**
 * Sidebar Component — Left navigation pane.
 *
 * Props:
 * - activeTab: current visible tab name ('home' | 'ask' | 'items' | 'history' | 'settings')
 * - setActiveTab: setter function to switch tabs
 * - darkMode: boolean indicating active theme
 * - setDarkMode: setter function for the theme toggle
 */
export default function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { id: 'ask', label: 'Ask', icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
      </svg>
    )},
    { id: 'items', label: 'Items', icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
        <path d="M6 6h10M6 10h10"/>
      </svg>
    )}
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-primary)'}}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <span className="brand-name" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Inkbox</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500, marginLeft: '4px' }}>AI Knowledge Inbox</span>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Assistant Card & Profile Footer */}
      <div className="sidebar-bottom-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
        {/* Helper Card */}
        <div className="sidebar-assistant-card" style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px dashed rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>Your AI research assistant</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Save, search and get answers from your content.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="sidebar-profile-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 4px',
          borderTop: '1px solid var(--color-border)',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              overflow: 'hidden'
            }}>
              T
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>Local Workspace</span>
            </div>
          </div>
          <button className="btn-icon" title="Workspace Settings" type="button" style={{ padding: '2px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <div className="sidebar-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button
            id="theme-toggle"
            className="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            type="button"
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
