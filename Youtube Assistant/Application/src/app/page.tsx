'use client';

import { useState, useCallback } from 'react';
import { RankedVideo, SearchResponse } from '@/types';
import QueryZone from '@/components/QueryZone';
import ResultsGrid from '@/components/ResultsGrid';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import StatusFooter from '@/components/StatusFooter';
import AnalyticsTab from '@/components/AnalyticsTab';

type AppState = 'idle' | 'loading' | 'results' | 'no-results' | 'error';
type ActiveTab = 'search' | 'analytics';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<AppState>('idle');
  const [queryId, setQueryId] = useState<string>('');
  const [lastQuery, setLastQuery] = useState<string>('');
  const [results, setResults] = useState<RankedVideo[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<{ [videoId: string]: 'thumbs_up' | 'thumbs_down' | 'none' }>({});
  const [toast, setToast] = useState<string | null>(null);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSearch = useCallback(async (query: string) => {
    setState('loading');
    setLastQuery(query);
    setFeedbackMap({});

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();

      setQueryId(data.queryId);
      setResults(data.results);

      if (data.results.length === 0) {
        setState('no-results');
      } else {
        setState('results');
      }
    } catch (error) {
      console.error('Search error:', error);
      setState('error');
    }
  }, []);

  const handleRetry = () => {
    if (lastQuery) {
      handleSearch(lastQuery);
    }
  };

  const handleFeedback = async (
    videoId: string,
    feedback: 'thumbs_up' | 'thumbs_down' | 'none'
  ) => {
    // Update local state immediately
    setFeedbackMap((prev) => ({ ...prev, [videoId]: feedback }));

    // Find the video to get its scores
    const video = results.find((v) => v.videoId === videoId);
    if (!video) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          videoId,
          feedback,
          compositeScore: video.compositeScore,
          rawSignals: video.rawSignals,
        }),
      });

      if (feedback !== 'none') {
        showToast('Feedback saved');
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleClick = async (videoId: string, rank: number) => {
    try {
      // Fire and forget - don't wait for response
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, videoId, clickedRank: rank }),
      });
    } catch (error) {
      console.error('Click tracking error:', error);
    }
  };

  return (
    <main style={styles.main}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <button
          style={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </button>

        {menuOpen && (
          <>
            <div style={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
            <div style={styles.menu}>
              <button
                style={{
                  ...styles.menuItem,
                  ...(activeTab === 'search' ? styles.menuItemActive : {}),
                }}
                onClick={() => handleTabChange('search')}
              >
                Search
              </button>
              <button
                style={{
                  ...styles.menuItem,
                  ...(activeTab === 'analytics' ? styles.menuItemActive : {}),
                }}
                onClick={() => handleTabChange('analytics')}
              >
                Analytics
              </button>
            </div>
          </>
        )}
      </nav>

      {activeTab === 'search' ? (
        <>
          <header style={styles.header}>
            <h1 style={styles.title}>YouTube Assistant</h1>
            <p style={styles.subtitle}>Find educational videos without wasting time on clickbait</p>
          </header>

          <section style={styles.querySection}>
            <QueryZone onSearch={handleSearch} isLoading={state === 'loading'} />
          </section>

          <section style={styles.resultsSection}>
            {state === 'idle' && (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Enter a topic above to find the best videos</p>
              </div>
            )}

            {state === 'loading' && <LoadingState />}

            {state === 'results' && (
              <ResultsGrid
                videos={results}
                queryId={queryId}
                feedbackMap={feedbackMap}
                onFeedback={handleFeedback}
                onClick={handleClick}
              />
            )}

            {state === 'no-results' && <ErrorState type="no-results" />}

            {state === 'error' && <ErrorState type="error" onRetry={handleRetry} />}
          </section>

          <StatusFooter />
        </>
      ) : (
        <AnalyticsTab />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    padding: '40px 24px 80px',
    position: 'relative',
  },
  nav: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 100,
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '28px',
    height: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  hamburgerLine: {
    display: 'block',
    width: '100%',
    height: '3px',
    backgroundColor: 'var(--foreground)',
    borderRadius: '2px',
  },
  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 99,
  },
  menu: {
    position: 'absolute',
    top: '32px',
    left: 0,
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    minWidth: '160px',
    zIndex: 100,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--foreground)',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  menuItemActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    color: 'var(--foreground)',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
  querySection: {
    marginBottom: '40px',
  },
  resultsSection: {
    paddingBottom: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyText: {
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
};
