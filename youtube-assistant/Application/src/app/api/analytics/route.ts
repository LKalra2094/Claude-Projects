import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  AnalyticsPeriod,
  AnalyticsSummary,
  TimeSeriesDataPoint,
  AnalyticsResponse,
} from '@/types';
import { getSessionUser } from '@/lib/auth';

/**
 * Get date N days ago as YYYY-MM-DD string.
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse period string to number of days.
 */
function periodToDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return null;
    default:
      return 7;
  }
}

/**
 * Get all dates between start and end (inclusive) as YYYY-MM-DD strings.
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '7d') as AnalyticsPeriod;
    // Admin can view another user's analytics
    const targetUserId = user.isAdmin && searchParams.get('userId')
      ? searchParams.get('userId')!
      : user.email;

    // Validate period
    if (!['7d', '30d', '90d', 'all'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use 7d, 30d, 90d, or all.' },
        { status: 400 }
      );
    }

    const today = getTodayString();
    const days = periodToDays(period);

    // Determine date range
    let startDate: string;
    if (days === null) {
      // "all" - find earliest date in data
      const earliestResult = await pool.query(
        `SELECT MIN(executed_at)::date AS earliest FROM query_history WHERE user_id = $1`,
        [targetUserId]
      );
      const earliest = earliestResult.rows[0]?.earliest;
      startDate = earliest
        ? (earliest instanceof Date ? earliest.toISOString().split('T')[0] : earliest)
        : today;
    } else {
      startDate = getDateDaysAgo(days - 1);
    }

    // Query 1: Queries in date range
    const queriesResult = await pool.query(
      `SELECT query_id, executed_at::date AS date
       FROM query_history
       WHERE executed_at::date >= $1 AND executed_at::date <= $2 AND user_id = $3`,
      [startDate, today, targetUserId]
    );

    // Query 2: Latest feedback per (query_id, video_id)
    const feedbackResult = await pool.query(
      `SELECT DISTINCT ON (query_id, video_id)
         query_id, video_id, feedback
       FROM feedback
       WHERE feedback_at::date >= $1 AND feedback_at::date <= $2 AND user_id = $3
       ORDER BY query_id, video_id, feedback_at DESC`,
      [startDate, today, targetUserId]
    );

    // Query 3: Click counts per query
    const clicksResult = await pool.query(
      `SELECT query_id, COUNT(*)::integer AS click_count
       FROM click_events
       WHERE clicked_at::date >= $1 AND clicked_at::date <= $2 AND user_id = $3
       GROUP BY query_id`,
      [startDate, today, targetUserId]
    );

    // Query 4: Quota log (global, not per-user)
    const quotaResult = await pool.query(
      `SELECT date, units_used
       FROM quota_log
       WHERE date >= $1 AND date <= $2`,
      [startDate, today]
    );

    // Build data structures from query results
    const filteredQueries = queriesResult.rows.map((row) => ({
      queryId: row.query_id as string,
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date as string,
    }));

    // Build click counts per queryId
    const clicksPerQuery = new Map<string, number>();
    clicksResult.rows.forEach((row) => {
      clicksPerQuery.set(row.query_id, row.click_count);
    });

    // Build latest feedback per queryId+videoId
    const feedbackByQueryVideo = new Map<string, 'thumbs_up' | 'thumbs_down' | 'none'>();
    feedbackResult.rows.forEach((row) => {
      const key = `${row.query_id}:${row.video_id}`;
      feedbackByQueryVideo.set(key, row.feedback);
    });

    // Count thumbs up/down per queryId
    const thumbsUpPerQuery = new Map<string, number>();
    const thumbsDownPerQuery = new Map<string, number>();

    feedbackByQueryVideo.forEach((feedback, key) => {
      const queryId = key.split(':')[0];
      if (feedback === 'thumbs_up') {
        thumbsUpPerQuery.set(queryId, (thumbsUpPerQuery.get(queryId) || 0) + 1);
      } else if (feedback === 'thumbs_down') {
        thumbsDownPerQuery.set(queryId, (thumbsDownPerQuery.get(queryId) || 0) + 1);
      }
    });

    // Group data by date
    const dateRange = getDateRange(startDate, today);

    // Pre-compute per-date aggregations
    const queriesByDate = new Map<string, string[]>();
    filteredQueries.forEach((q) => {
      if (!queriesByDate.has(q.date)) {
        queriesByDate.set(q.date, []);
      }
      queriesByDate.get(q.date)!.push(q.queryId);
    });

    const quotaByDate = new Map<string, number>();
    quotaResult.rows.forEach((row) => {
      const dateStr = row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : row.date;
      quotaByDate.set(dateStr, row.units_used);
    });

    // Build time series
    const timeSeries: TimeSeriesDataPoint[] = dateRange.map((date) => {
      const queryIds = queriesByDate.get(date) || [];
      const searches = queryIds.length;

      const nullSearches = queryIds.filter((qid) => !clicksPerQuery.has(qid)).length;
      const nullSearchPercent = searches > 0 ? (nullSearches / searches) * 100 : 0;

      const totalThumbsUp = queryIds.reduce(
        (sum, qid) => sum + (thumbsUpPerQuery.get(qid) || 0),
        0
      );
      const totalThumbsDown = queryIds.reduce(
        (sum, qid) => sum + (thumbsDownPerQuery.get(qid) || 0),
        0
      );
      const thumbsUpPerSearch = searches > 0 ? totalThumbsUp / searches : 0;
      const thumbsDownPerSearch = searches > 0 ? totalThumbsDown / searches : 0;

      const totalClicks = queryIds.reduce(
        (sum, qid) => sum + (clicksPerQuery.get(qid) || 0),
        0
      );
      const clicksPerSearch = searches > 0 ? totalClicks / searches : 0;

      const apiUnits = quotaByDate.get(date) || 0;

      return {
        date,
        searches,
        nullSearchPercent: Math.round(nullSearchPercent * 10) / 10,
        thumbsUpPerSearch: Math.round(thumbsUpPerSearch * 10) / 10,
        thumbsDownPerSearch: Math.round(thumbsDownPerSearch * 10) / 10,
        clicksPerSearch: Math.round(clicksPerSearch * 10) / 10,
        apiUnits,
      };
    });

    // Calculate summary (averages across period)
    const totalDays = timeSeries.length;

    const totalSearches = timeSeries.reduce((sum, d) => sum + d.searches, 0);
    const totalNullSearches = filteredQueries.filter(
      (q) => !clicksPerQuery.has(q.queryId)
    ).length;
    const totalThumbsUp = Array.from(thumbsUpPerQuery.values()).reduce(
      (sum, v) => sum + v,
      0
    );
    const totalThumbsDown = Array.from(thumbsDownPerQuery.values()).reduce(
      (sum, v) => sum + v,
      0
    );
    const totalClicks = Array.from(clicksPerQuery.values()).reduce(
      (sum, v) => sum + v,
      0
    );
    const totalApiUnits = timeSeries.reduce((sum, d) => sum + d.apiUnits, 0);

    const summary: AnalyticsSummary = {
      searchesPerDay:
        totalDays > 0 ? Math.round((totalSearches / totalDays) * 10) / 10 : 0,
      nullSearchPercent:
        totalSearches > 0
          ? Math.round((totalNullSearches / totalSearches) * 1000) / 10
          : 0,
      thumbsUpPerSearch:
        totalSearches > 0 ? Math.round((totalThumbsUp / totalSearches) * 10) / 10 : 0,
      thumbsDownPerSearch:
        totalSearches > 0
          ? Math.round((totalThumbsDown / totalSearches) * 10) / 10
          : 0,
      clicksPerSearch:
        totalSearches > 0 ? Math.round((totalClicks / totalSearches) * 10) / 10 : 0,
      apiUnitsPerDay:
        totalDays > 0 ? Math.round(totalApiUnits / totalDays) : 0,
    };

    const response: AnalyticsResponse = {
      period,
      summary,
      timeSeries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analytics failed' },
      { status: 500 }
    );
  }
}
