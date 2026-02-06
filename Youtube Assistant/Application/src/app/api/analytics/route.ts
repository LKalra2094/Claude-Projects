import { NextRequest, NextResponse } from 'next/server';
import { readStorage } from '@/services/storage';
import {
  AnalyticsPeriod,
  AnalyticsSummary,
  TimeSeriesDataPoint,
  AnalyticsResponse,
} from '@/types';

/**
 * Get date N days ago as YYYY-MM-DD string.
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
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
      return null; // No limit
    default:
      return 7;
  }
}

/**
 * Get all dates between start and end (inclusive) as YYYY-MM-DD strings.
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Extract date from ISO timestamp.
 */
function extractDate(isoTimestamp: string): string {
  return isoTimestamp.split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '7d') as AnalyticsPeriod;

    // Validate period
    if (!['7d', '30d', '90d', 'all'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use 7d, 30d, 90d, or all.' },
        { status: 400 }
      );
    }

    const data = readStorage();
    const today = getTodayString();
    const days = periodToDays(period);

    // Determine date range
    let startDate: string;
    if (days === null) {
      // "all" - find earliest date in data
      const allDates = [
        ...data.queryHistory.map((q) => extractDate(q.executedAt)),
        ...data.quotaLog.map((q) => q.date),
      ];
      startDate = allDates.length > 0 ? allDates.sort()[0] : today;
    } else {
      startDate = getDateDaysAgo(days - 1); // -1 because we include today
    }

    // Filter data by period
    const filteredQueries = data.queryHistory.filter((q) => {
      const date = extractDate(q.executedAt);
      return date >= startDate && date <= today;
    });

    const filteredFeedback = data.feedback.filter((f) => {
      const date = extractDate(f.feedbackAt);
      return date >= startDate && date <= today;
    });

    const filteredClicks = data.clickEvents.filter((c) => {
      const date = extractDate(c.clickedAt);
      return date >= startDate && date <= today;
    });

    const filteredQuota = data.quotaLog.filter((q) => {
      return q.date >= startDate && q.date <= today;
    });

    // Build query ID to date map
    const queryIdToDate = new Map<string, string>();
    filteredQueries.forEach((q) => {
      queryIdToDate.set(q.queryId, extractDate(q.executedAt));
    });

    // Build click counts per queryId
    const clicksPerQuery = new Map<string, number>();
    filteredClicks.forEach((c) => {
      clicksPerQuery.set(c.queryId, (clicksPerQuery.get(c.queryId) || 0) + 1);
    });

    // Build latest feedback per queryId+videoId
    const feedbackByQueryVideo = new Map<string, 'thumbs_up' | 'thumbs_down' | 'none'>();
    filteredFeedback.forEach((f) => {
      const key = `${f.queryId}:${f.videoId}`;
      feedbackByQueryVideo.set(key, f.feedback);
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
    const queriesByDate = new Map<string, string[]>(); // date -> queryIds
    filteredQueries.forEach((q) => {
      const date = extractDate(q.executedAt);
      if (!queriesByDate.has(date)) {
        queriesByDate.set(date, []);
      }
      queriesByDate.get(date)!.push(q.queryId);
    });

    const quotaByDate = new Map<string, number>();
    filteredQuota.forEach((q) => {
      quotaByDate.set(q.date, q.unitsUsed);
    });

    // Build time series
    const timeSeries: TimeSeriesDataPoint[] = dateRange.map((date) => {
      const queryIds = queriesByDate.get(date) || [];
      const searches = queryIds.length;

      // Null searches = searches with 0 clicks
      const nullSearches = queryIds.filter((qid) => !clicksPerQuery.has(qid)).length;
      const nullSearchPercent = searches > 0 ? (nullSearches / searches) * 100 : 0;

      // Thumbs up/down per search
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

      // Clicks per search
      const totalClicks = queryIds.reduce(
        (sum, qid) => sum + (clicksPerQuery.get(qid) || 0),
        0
      );
      const clicksPerSearch = searches > 0 ? totalClicks / searches : 0;

      // API units
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
    const daysWithSearches = timeSeries.filter((d) => d.searches > 0).length;

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
