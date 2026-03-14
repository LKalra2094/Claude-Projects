'use client';

import { NormalizedSignals } from '@/types';

interface ScoreBreakdownProps {
  normalizedSignals: NormalizedSignals;
  compositeScore: number;
}

const SIGNAL_LABELS: { [key in keyof NormalizedSignals]: string } = {
  commentDensity: 'Comment Density',
  subscriberCount: 'Channel Size',
  queryDescriptionOverlap: 'Relevance',
  viewCount: 'Popularity',
  freshness: 'Freshness',
};

export default function ScoreBreakdown({ normalizedSignals, compositeScore }: ScoreBreakdownProps) {
  return (
    <div style={styles.tooltip}>
      <div style={styles.header}>Score Breakdown</div>
      {Object.entries(normalizedSignals).map(([key, value]) => (
        <div key={key} style={styles.row}>
          <span style={styles.label}>{SIGNAL_LABELS[key as keyof NormalizedSignals]}</span>
          <div style={styles.barContainer}>
            <div style={{ ...styles.bar, width: `${value * 100}%` }} />
          </div>
          <span style={styles.value}>{(value * 100).toFixed(0)}</span>
        </div>
      ))}
      <div style={styles.total}>
        <span>Total</span>
        <span style={styles.totalValue}>{(compositeScore * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '0',
    marginBottom: '8px',
    backgroundColor: 'var(--foreground)',
    color: 'var(--background)',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    width: '200px',
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  header: {
    fontWeight: 600,
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  label: {
    flex: '0 0 80px',
    fontSize: '11px',
  },
  barContainer: {
    flex: 1,
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  value: {
    flex: '0 0 24px',
    textAlign: 'right',
    fontSize: '11px',
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    fontWeight: 600,
  },
  totalValue: {
    color: 'var(--primary)',
  },
};
