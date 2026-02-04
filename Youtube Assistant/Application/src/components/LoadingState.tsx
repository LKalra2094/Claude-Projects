'use client';

export default function LoadingState() {
  // Show 10 skeleton cards in a 5x2 grid
  const skeletons = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div style={styles.grid}>
      {skeletons.map((i) => (
        <div key={i} style={styles.card}>
          <div className="skeleton" style={styles.thumbnail} />
          <div style={styles.content}>
            <div className="skeleton" style={styles.title} />
            <div className="skeleton" style={styles.channel} />
            <div className="skeleton" style={styles.stats} />
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'var(--card-background)',
    borderRadius: '12px',
    border: '1px solid var(--card-border)',
    overflow: 'hidden',
  },
  thumbnail: {
    aspectRatio: '16/9',
    width: '100%',
  },
  content: {
    padding: '12px',
  },
  title: {
    height: '18px',
    marginBottom: '8px',
    width: '90%',
  },
  channel: {
    height: '14px',
    marginBottom: '8px',
    width: '60%',
  },
  stats: {
    height: '12px',
    width: '80%',
  },
};
