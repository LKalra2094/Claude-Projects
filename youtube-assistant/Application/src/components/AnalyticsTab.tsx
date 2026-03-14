'use client';

import { useState, useEffect } from 'react';
import { AnalyticsPeriod, AnalyticsResponse } from '@/types';
import TimeSeriesChart from './TimeSeriesChart';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

export default function AnalyticsTab() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics?period=${period}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const result: AnalyticsResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  // Check if there's any data
  const hasData = data && data.timeSeries.some((d) => d.searches > 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Analytics</h2>
        </div>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Analytics</h2>
        </div>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Analytics</h2>
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No data yet. Start searching to see analytics.</p>
        </div>
      </div>
    );
  }

  const { summary, timeSeries } = data!;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Analytics</h2>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* Summary Row */}
      <div style={styles.summaryRow}>
        <SummaryCard label="Searches/Day" value={summary.searchesPerDay.toFixed(1)} />
        <SummaryCard label="Null Search %" value={`${summary.nullSearchPercent.toFixed(1)}%`} />
        <SummaryCard label="👍/Search" value={summary.thumbsUpPerSearch.toFixed(1)} />
        <SummaryCard label="👎/Search" value={summary.thumbsDownPerSearch.toFixed(1)} />
        <SummaryCard label="Clicks/Search" value={summary.clicksPerSearch.toFixed(1)} />
        <SummaryCard label="API Units/Day" value={summary.apiUnitsPerDay.toString()} />
      </div>

      {/* Chart 1: Searches per day */}
      <TimeSeriesChart
        data={timeSeries}
        title="Searches per Day"
        chartType="bar"
        configs={[{ dataKey: 'searches', name: 'Searches', color: '#3b82f6' }]}
      />

      {/* Chart 2: Null search % */}
      <TimeSeriesChart
        data={timeSeries}
        title="Null Searches %"
        chartType="line"
        configs={[{ dataKey: 'nullSearchPercent', name: 'Null %', color: '#f59e0b' }]}
        formatYAxis={(v) => `${v}%`}
        formatTooltip={(v) => `${v}%`}
      />

      {/* Chart 3: Thumbs up vs thumbs down */}
      <TimeSeriesChart
        data={timeSeries}
        title="Feedback per Search"
        chartType="line"
        configs={[
          { dataKey: 'thumbsUpPerSearch', name: 'Thumbs Up', color: '#22c55e' },
          { dataKey: 'thumbsDownPerSearch', name: 'Thumbs Down', color: '#ef4444' },
        ]}
      />

      {/* Chart 4: Clicks per search */}
      <TimeSeriesChart
        data={timeSeries}
        title="Videos Clicked per Search"
        chartType="line"
        configs={[{ dataKey: 'clicksPerSearch', name: 'Clicks', color: '#8b5cf6' }]}
      />

      {/* Chart 5: API units per day */}
      <TimeSeriesChart
        data={timeSeries}
        title="API Units per Day"
        chartType="bar"
        configs={[{ dataKey: 'apiUnits', name: 'Units', color: '#06b6d4' }]}
      />
    </div>
  );
}

function PeriodSelector({
  period,
  onChange,
}: {
  period: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
}) {
  return (
    <div style={styles.periodSelector}>
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          style={{
            ...styles.periodButton,
            ...(period === opt.value ? styles.periodButtonActive : {}),
          }}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryValue}>{value}</div>
      <div style={styles.summaryLabel}>{label}</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '0 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--foreground)',
  },
  periodSelector: {
    display: 'flex',
    gap: '8px',
    backgroundColor: 'var(--card-bg)',
    padding: '4px',
    borderRadius: '8px',
  },
  periodButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  periodButtonActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--foreground)',
    marginBottom: '4px',
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    color: 'var(--text-muted)',
    fontSize: '16px',
  },
  error: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#ef4444',
    fontSize: '16px',
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
