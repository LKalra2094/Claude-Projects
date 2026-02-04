'use client';

import { useState, useCallback } from 'react';
import { RankedVideo, SearchResponse, RawSignals } from '@/types';
import QueryZone from '@/components/QueryZone';
import ResultsGrid from '@/components/ResultsGrid';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import StatusFooter from '@/components/StatusFooter';

type AppState = 'idle' | 'loading' | 'results' | 'no-results' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [queryId, setQueryId] = useState<string>('');
  const [lastQuery, setLastQuery] = useState<string>('');
  const [results, setResults] = useState<RankedVideo[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<{ [videoId: string]: 'thumbs_up' | 'thumbs_down' | 'none' }>({});
  const [toast, setToast] = useState<string | null>(null);

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

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    padding: '40px 24px 80px',
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
