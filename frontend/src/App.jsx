import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IngestForm from './components/IngestForm';
import ItemsList from './components/ItemsList';
import QueryBox from './components/QueryBox';
import AnswerDisplay from './components/AnswerDisplay';
import SavedItemsTable from './components/SavedItemsTable';
import { getItems } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(true);

  // Centralized items store to sync dashboard and items list
  const [items, setItems] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  // Selected query output and active question
  const [queryResult, setQueryResult] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState('');

  // Toggle .dark-mode class on body element
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Synchronize items centrally
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const data = await getItems();
        setItems(data.items || []);
        setItemsError(null);
      } catch (err) {
        setItemsError(err.message);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [refreshTrigger]);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleIngestSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleQueryStart = (question) => {
    setActiveQuestion(question);
    setQueryResult(null); // Clear previous answer
  };

  const handleQueryResult = (result, question) => {
    setQueryResult(result);
  };

  const handleResetQuery = () => {
    setQueryResult(null);
    setActiveQuestion('');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />

      {/* Main Panel Viewport */}
      <main className="main-content" style={{ display: 'flex', gap: '32px', width: '100%', minWidth: 0 }}>
        {/* Left/Middle Column (Dynamic active page content) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* --- 1. HOME TAB (DASHBOARD GRID) --- */}
          {activeTab === 'home' && (
            <div>
              <header className="view-header">
                <h1 className="view-title">{getGreeting()}, Tejeswar 👋</h1>
                <p className="view-subtitle">Save content and ask anything about it.</p>
              </header>

              <div className="dashboard-grid">
                {/* Add Content split cards */}
                <div className="add-cards-row">
                  <IngestForm onIngestSuccess={handleIngestSuccess} fixedType="note" />
                  <IngestForm onIngestSuccess={handleIngestSuccess} fixedType="url" />
                </div>

                {/* Saved items table */}
                <div className="full-width-card">
                  <SavedItemsTable 
                    items={items} 
                    limit={5} 
                    onViewAll={() => setActiveTab('items')} 
                  />
                </div>

                {/* Quick Query Box */}
                <div className="full-width-card">
                  <QueryBox onResult={handleQueryResult} onQueryStart={handleQueryStart} />
                </div>
              </div>
            </div>
          )}

          {/* --- 2. ASK TAB (Dedicated query prompt card) --- */}
          {activeTab === 'ask' && (
            <div>
              <header className="view-header">
                <h1 className="view-title">Ask a Question</h1>
                <p className="view-subtitle">Retrieve answers from saved notebooks and live web searches</p>
              </header>

              <div style={{ maxWidth: '640px' }}>
                <QueryBox onResult={handleQueryResult} onQueryStart={handleQueryStart} />
              </div>
            </div>
          )}

          {/* --- 3. ITEMS TAB (FULL CONTENT LIST) --- */}
          {activeTab === 'items' && (
            <div>
              <header className="view-header">
                <h1 className="view-title">Saved Items</h1>
                <p className="view-subtitle">Full list of ingested documents and web URLs</p>
              </header>
              <ItemsList refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>

        {/* Right Docked Answer Panel (Home and Ask views only) */}
        {(activeTab === 'home' || activeTab === 'ask') && (activeQuestion || queryResult) && (
          <div className="right-docked-panel" style={{ width: '420px', flexShrink: 0, height: 'fit-content' }}>
            <AnswerDisplay 
              result={queryResult} 
              question={activeQuestion} 
              onReset={handleResetQuery} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
