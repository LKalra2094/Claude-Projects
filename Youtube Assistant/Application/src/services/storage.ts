import pool from '@/lib/db';
import {
  QueryHistoryEntry,
  FeedbackEntry,
  ClickEvent,
  QuotaLogEntry,
} from '@/types';

/**
 * Generate a random query ID.
 */
export function generateQueryId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'q_';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Add a query history entry.
 */
export async function addQueryHistory(entry: QueryHistoryEntry): Promise<void> {
  await pool.query(
    `INSERT INTO query_history (query_id, query, executed_at, result_count, top_videos)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.queryId, entry.query, entry.executedAt, entry.resultCount, entry.topVideos]
  );
}

/**
 * Add a feedback entry.
 * Feedback is append-only; most recent per queryId+videoId is authoritative.
 */
export async function addFeedback(entry: FeedbackEntry): Promise<void> {
  await pool.query(
    `INSERT INTO feedback (query_id, video_id, feedback, composite_score, raw_signals, feedback_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      entry.queryId,
      entry.videoId,
      entry.feedback,
      entry.compositeScore,
      JSON.stringify(entry.rawSignals),
      entry.feedbackAt,
    ]
  );
}

/**
 * Get the most recent feedback for a query+video pair.
 */
export async function getLatestFeedback(
  queryId: string,
  videoId: string
): Promise<FeedbackEntry | undefined> {
  const result = await pool.query(
    `SELECT query_id, video_id, feedback, composite_score, raw_signals, feedback_at
     FROM feedback
     WHERE query_id = $1 AND video_id = $2
     ORDER BY feedback_at DESC
     LIMIT 1`,
    [queryId, videoId]
  );

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    queryId: row.query_id,
    videoId: row.video_id,
    feedback: row.feedback,
    compositeScore: row.composite_score,
    rawSignals: row.raw_signals,
    feedbackAt: row.feedback_at instanceof Date
      ? row.feedback_at.toISOString()
      : row.feedback_at,
  };
}

/**
 * Add a click event.
 */
export async function addClickEvent(event: ClickEvent): Promise<void> {
  await pool.query(
    `INSERT INTO click_events (query_id, video_id, clicked_rank, clicked_at)
     VALUES ($1, $2, $3, $4)`,
    [event.queryId, event.videoId, event.clickedRank, event.clickedAt]
  );
}

/**
 * Increment quota usage for today.
 * Uses atomic upsert — no race conditions.
 */
export async function incrementQuota(units: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await pool.query(
    `INSERT INTO quota_log (date, units_used) VALUES ($1, $2)
     ON CONFLICT (date) DO UPDATE SET units_used = quota_log.units_used + EXCLUDED.units_used`,
    [today, units]
  );
}

/**
 * Get today's quota usage.
 */
export async function getTodayQuota(): Promise<QuotaLogEntry> {
  const today = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT date, units_used FROM quota_log WHERE date = $1`,
    [today]
  );

  if (result.rows.length === 0) return { date: today, unitsUsed: 0 };

  return {
    date: result.rows[0].date instanceof Date
      ? result.rows[0].date.toISOString().split('T')[0]
      : result.rows[0].date,
    unitsUsed: result.rows[0].units_used,
  };
}
