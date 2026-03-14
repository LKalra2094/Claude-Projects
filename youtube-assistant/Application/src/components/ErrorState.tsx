'use client';

interface ErrorStateProps {
  type: 'error' | 'no-results';
  onRetry?: () => void;
}

export default function ErrorState({ type, onRetry }: ErrorStateProps) {
  if (type === 'no-results') {
    return (
      <div style={styles.container}>
        <div style={styles.icon}>🔍</div>
        <h3 style={styles.title}>No videos found</h3>
        <p style={styles.message}>
          Try broader keywords or a different topic.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.icon}>⚠️</div>
      <h3 style={styles.title}>Something went wrong</h3>
      <p style={styles.message}>
        We couldn&apos;t complete the search. Please try again.
      </p>
      {onRetry && (
        <button onClick={onRetry} style={styles.button}>
          Try Again
        </button>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '0 auto',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'var(--foreground)',
  },
  message: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    backgroundColor: 'var(--primary)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
