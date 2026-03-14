'use client';

import { useEffect, useState } from 'react';
import { QuotaResponse } from '@/types';

export default function StatusFooter() {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/quota');
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  };

  useEffect(() => {
    fetchQuota();
    // Refresh quota every 30 seconds
    const interval = setInterval(fetchQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!quota) return null;

  const barWidth = Math.min(quota.percentUsed, 100);
  const barColor = quota.percentUsed > 80 ? 'var(--error)' : 'var(--primary)';

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <span style={styles.label}>Daily API Quota:</span>
        <div style={styles.barContainer}>
          <div style={{ ...styles.bar, width: `${barWidth}%`, backgroundColor: barColor }} />
        </div>
        <span style={styles.value}>
          {quota.unitsUsedToday.toLocaleString()} / {quota.dailyLimit.toLocaleString()} ({quota.percentUsed}%)
        </span>
      </div>
    </footer>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--card-background)',
    borderTop: '1px solid var(--card-border)',
    padding: '12px 24px',
    zIndex: 50,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  barContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: 'var(--card-border)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  value: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
};
