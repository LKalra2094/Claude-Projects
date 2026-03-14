'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { WeightSet, WeightRecord } from '@/types';

const SIGNAL_LABELS: Record<keyof WeightSet, string> = {
  commentDensity: 'Comment Density',
  subscriberCount: 'Channel Size',
  queryDescriptionOverlap: 'Relevance',
  viewCount: 'Popularity',
  freshness: 'Freshness',
  youtubeRank: 'YouTube Rank',
};

const SIGNAL_KEYS = Object.keys(SIGNAL_LABELS) as (keyof WeightSet)[];

interface UserInfo {
  email: string;
  name: string;
  image: string;
  createdAt: string;
}

interface UserStats {
  email: string;
  name: string;
  image: string;
  totalSearches: number;
  totalClicks: number;
  totalFeedback: number;
}

interface WeightsData {
  source: 'learned' | 'default';
  weights: WeightSet;
  defaultWeights: WeightSet;
  activeRecord: WeightRecord | null;
  history: WeightRecord[];
  dataStats: { total: number; thumbsUp: number; thumbsDown: number };
}

interface TrainResponse {
  dryRun?: boolean;
  proposed?: WeightSet;
  current?: WeightSet;
  defaultWeights?: WeightSet;
  validationAcc?: number;
  totalSamples?: number;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  epochs?: number;
  passedValidation?: boolean;
  trainingLoss?: number;
  success?: boolean;
  message?: string;
  error?: string;
  record?: WeightRecord;
}

export default function AdminTab() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [data, setData] = useState<WeightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<TrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch user activity stats
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/user-stats');
        if (!res.ok) return;
        const result = await res.json();
        setUserStats(result.users);
      } catch {
        // silently fail
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Fetch users list
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const result = await res.json();
        setUsers(result.users);
        // Default to admin's own email
        if (session?.user?.email && result.users.length > 0) {
          setSelectedUser(session.user.email);
        }
      } catch {
        // silently fail
      }
    }
    loadUsers();
  }, [session?.user?.email]);

  const fetchWeights = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weights?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to fetch weights');
      const result: WeightsData = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setTrainResult(null);
      fetchWeights(selectedUser);
    }
  }, [selectedUser, fetchWeights]);

  const handleDryRun = async () => {
    setTraining(true);
    setTrainResult(null);
    try {
      const res = await fetch('/api/weights/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, userId: selectedUser }),
      });
      const result: TrainResponse = await res.json();
      if (!res.ok) {
        setError(result.error || 'Training failed');
      } else {
        setTrainResult(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleActivate = async () => {
    setTraining(true);
    try {
      const res = await fetch('/api/weights/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false, userId: selectedUser }),
      });
      const result: TrainResponse = await res.json();
      if (!res.ok) {
        setError(result.error || result.message || 'Activation failed');
      } else {
        showToast('Weights activated');
        setTrainResult(null);
        await fetchWeights(selectedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setTraining(false);
    }
  };

  const handleRevert = async () => {
    try {
      const res = await fetch('/api/weights/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', userId: selectedUser }),
      });
      if (!res.ok) throw new Error('Revert failed');
      showToast('Reverted to defaults');
      setTrainResult(null);
      await fetchWeights(selectedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revert failed');
    }
  };

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Admin</h2>
        <p style={styles.muted}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin</h2>

      {/* User Picker */}
      {users.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Select User</h3>
          <select
            style={styles.select}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.email} value={u.email}>
                {u.name || u.email} ({u.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User Activity */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>User Activity</h3>
        {statsLoading ? (
          <p style={styles.muted}>Loading...</p>
        ) : userStats.length === 0 ? (
          <p style={styles.muted}>No user activity yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Searches</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Clicks</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((u) => (
                <tr key={u.email}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      {u.image && (
                        <img
                          src={u.image}
                          alt=""
                          style={styles.userAvatar}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{u.totalSearches}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{u.totalClicks}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{u.totalFeedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.dismissBtn} onClick={() => setError(null)}>x</button>
        </div>
      )}

      {data && (
        <>
          {/* Current Weights */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              Current Weights
              <span style={styles.badge}>{data.source}</span>
            </h3>
            <WeightBars weights={data.weights} defaultWeights={data.defaultWeights} />
            {data.source === 'learned' && data.activeRecord && (
              <div style={styles.meta}>
                <span>Trained on {data.activeRecord.trainingCount} samples</span>
                <span>Accuracy: {(data.activeRecord.validationAcc * 100).toFixed(1)}%</span>
                <span>Activated: {new Date(data.activeRecord.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Training Data Stats */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Training Data</h3>
            <div style={styles.statsRow}>
              <StatBox label="Total Feedback" value={data.dataStats.total} />
              <StatBox label="Thumbs Up" value={data.dataStats.thumbsUp} />
              <StatBox label="Thumbs Down" value={data.dataStats.thumbsDown} />
              <StatBox label="Needed" value={Math.max(0, 30 - data.dataStats.total)} />
            </div>
            {data.dataStats.total < 30 && (
              <p style={styles.hint}>
                Need {30 - data.dataStats.total} more feedback events before training (min 5 of each type).
              </p>
            )}
          </div>

          {/* Train Controls */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Train Model</h3>
            <div style={styles.buttonRow}>
              <button
                style={styles.primaryBtn}
                onClick={handleDryRun}
                disabled={training}
              >
                {training ? 'Training...' : 'Preview New Weights'}
              </button>
              {data.source === 'learned' && (
                <button style={styles.secondaryBtn} onClick={handleRevert}>
                  Revert to Defaults
                </button>
              )}
            </div>

            {/* Dry-run results */}
            {trainResult && trainResult.dryRun && trainResult.proposed && (
              <div style={styles.previewBox}>
                <h4 style={styles.previewTitle}>Proposed Weights</h4>
                <WeightBars
                  weights={trainResult.proposed}
                  defaultWeights={data.defaultWeights}
                />
                <div style={styles.meta}>
                  <span>Validation: {((trainResult.validationAcc || 0) * 100).toFixed(1)}%</span>
                  <span>Samples: {trainResult.totalSamples}</span>
                  <span>Epochs: {trainResult.epochs}</span>
                  <span>{trainResult.passedValidation ? 'Passed' : 'Failed'} validation</span>
                </div>
                {trainResult.passedValidation && (
                  <button
                    style={styles.activateBtn}
                    onClick={handleActivate}
                    disabled={training}
                  >
                    {training ? 'Activating...' : 'Activate These Weights'}
                  </button>
                )}
                {!trainResult.passedValidation && (
                  <p style={styles.hint}>
                    Validation accuracy below 65%. Cannot activate. Collect more feedback data.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Weight History */}
          {data.history.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Weight History</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Samples</th>
                    <th style={styles.th}>Accuracy</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((record) => (
                    <tr key={record.id}>
                      <td style={styles.td}>{new Date(record.createdAt).toLocaleDateString()}</td>
                      <td style={styles.td}>{record.trainingCount}</td>
                      <td style={styles.td}>{(record.validationAcc * 100).toFixed(1)}%</td>
                      <td style={styles.td}>
                        <span style={record.isActive ? styles.activeBadge : styles.inactiveBadge}>
                          {record.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function WeightBars({ weights, defaultWeights }: { weights: WeightSet; defaultWeights: WeightSet }) {
  return (
    <div style={styles.weightBars}>
      {SIGNAL_KEYS.map((key) => (
        <div key={key} style={styles.weightRow}>
          <span style={styles.weightLabel}>{SIGNAL_LABELS[key]}</span>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.bar,
                width: `${weights[key] * 200}%`,
              }}
            />
            <div
              style={{
                ...styles.defaultMarker,
                left: `${defaultWeights[key] * 200}%`,
              }}
            />
          </div>
          <span style={styles.weightValue}>{(weights[key] * 100).toFixed(0)}%</span>
        </div>
      ))}
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: 'var(--accent)' }} /> Current
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: 'var(--text-muted)' }} /> Default
        </span>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: 'var(--foreground)',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--foreground)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid rgba(128,128,128,0.3)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    cursor: 'pointer',
  },
  weightBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  weightRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  weightLabel: {
    flex: '0 0 100px',
    fontSize: '13px',
    color: 'var(--foreground)',
  },
  barContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'visible',
  },
  bar: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  defaultMarker: {
    position: 'absolute',
    top: '-2px',
    width: '2px',
    height: '12px',
    backgroundColor: 'var(--text-muted)',
    borderRadius: '1px',
  },
  weightValue: {
    flex: '0 0 36px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--foreground)',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
    paddingTop: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  legendDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  meta: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    flexWrap: 'wrap',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
  },
  statBox: {
    flex: 1,
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--foreground)',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '12px',
    fontStyle: 'italic',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid rgba(128,128,128,0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  activateBtn: {
    marginTop: '12px',
    padding: '10px 20px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  previewBox: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'rgba(128,128,128,0.06)',
    borderRadius: '8px',
    border: '1px solid rgba(128,128,128,0.15)',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--foreground)',
  },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(128,128,128,0.2)',
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontSize: '12px',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(128,128,128,0.1)',
    color: 'var(--foreground)',
  },
  activeBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
  },
  inactiveBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(128,128,128,0.1)',
    color: 'var(--text-muted)',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};
