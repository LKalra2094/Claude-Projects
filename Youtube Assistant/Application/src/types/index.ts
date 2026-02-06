// ============================================
// YouTube API Response Types
// ============================================

export interface YouTubeSearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    liveBroadcastContent: 'none' | 'live' | 'upcoming';
  };
}

export interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    liveBroadcastContent: 'none' | 'live' | 'upcoming';
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 format, e.g., "PT38M12S"
  };
  status: {
    madeForKids: boolean;
  };
}

export interface YouTubeChannelDetails {
  id: string;
  statistics: {
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
  };
}

// ============================================
// Ranking Types
// ============================================

export interface RawSignals {
  commentDensity: number;
  subscriberCount: number;
  queryDescriptionOverlap: number;
  viewCount: number;
  freshness: number;
}

export interface NormalizedSignals {
  commentDensity: number;
  subscriberCount: number;
  queryDescriptionOverlap: number;
  viewCount: number;
  freshness: number;
}

export interface RankedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount: number;
  commentCount: number;
  subscriberCount: number;
  compositeScore: number;
  rawSignals: RawSignals;
  normalizedSignals: NormalizedSignals;
}

// ============================================
// Storage Types (JSON file schema)
// ============================================

export interface QueryHistoryEntry {
  queryId: string;
  query: string;
  executedAt: string;
  resultCount: number;
  topVideos: string[]; // Top 3 video IDs in ranked order
}

export interface FeedbackEntry {
  queryId: string;
  videoId: string;
  feedback: 'thumbs_up' | 'thumbs_down' | 'none';
  compositeScore: number;
  rawSignals: RawSignals;
  feedbackAt: string;
}

export interface ClickEvent {
  queryId: string;
  videoId: string;
  clickedRank: number;
  clickedAt: string;
}

export interface QuotaLogEntry {
  date: string; // YYYY-MM-DD
  unitsUsed: number;
}

export interface StorageData {
  queryHistory: QueryHistoryEntry[];
  feedback: FeedbackEntry[];
  clickEvents: ClickEvent[];
  quotaLog: QuotaLogEntry[];
}

// ============================================
// API Request/Response Types
// ============================================

// POST /api/search
export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  queryId: string;
  results: RankedVideo[];
  quotaUnitsUsed: number;
}

// POST /api/feedback
export interface FeedbackRequest {
  queryId: string;
  videoId: string;
  feedback: 'thumbs_up' | 'thumbs_down' | 'none';
  compositeScore: number;
  rawSignals: RawSignals;
}

// POST /api/click
export interface ClickRequest {
  queryId: string;
  videoId: string;
  clickedRank: number;
}

// GET /api/quota
export interface QuotaResponse {
  unitsUsedToday: number;
  dailyLimit: number;
  percentUsed: number;
}

// ============================================
// Analytics Types
// ============================================

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsSummary {
  searchesPerDay: number;
  nullSearchPercent: number;
  thumbsUpPerSearch: number;
  thumbsDownPerSearch: number;
  clicksPerSearch: number;
  apiUnitsPerDay: number;
}

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD
  searches: number;
  nullSearchPercent: number;
  thumbsUpPerSearch: number;
  thumbsDownPerSearch: number;
  clicksPerSearch: number;
  apiUnits: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesDataPoint[];
}
