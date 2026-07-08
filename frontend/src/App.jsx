import { useState } from 'react';
import IngestForm from './components/IngestForm';
import ItemsList from './components/ItemsList';
import QueryBox from './components/QueryBox';
import AnswerDisplay from './components/AnswerDisplay';

/**
 * App — Main application component.
 *
 * Layout:
 * - Left column: Add content (IngestForm) + Saved items (ItemsList)
 * - Right column: Ask question (QueryBox) + Answer display (AnswerDisplay)
 *
 * State management:
 * - refreshTrigger: counter that increments on successful ingestion → triggers ItemsList refresh
 * - queryResult: stores the latest query response → passed to AnswerDisplay
 */
export default function App() {
  // Debug logging to verify environment variable injection in Vercel
  console.log("DEBUG: Configured VITE_API_URL is:", import.meta.env.VITE_API_URL || "(Empty/Relative)");

  // Incrementing this triggers ItemsList to re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Latest query result from the RAG pipeline
  const [queryResult, setQueryResult] = useState(null);

  const handleIngestSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleQueryResult = (result) => {
    setQueryResult(result);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span>AI Knowledge</span> Inbox
        </h1>
        <p>Save notes & URLs, then ask questions powered by AI</p>
      </header>

      <main className="app-content">
        {/* Left: Add content + view saved items */}
        <div className="left-column">
          <IngestForm onIngestSuccess={handleIngestSuccess} />
          <ItemsList refreshTrigger={refreshTrigger} />
        </div>

        {/* Right: Ask questions + view answers */}
        <div className="right-column">
          <QueryBox onResult={handleQueryResult} />
          <AnswerDisplay result={queryResult} />
        </div>
      </main>
    </div>
  );
}
