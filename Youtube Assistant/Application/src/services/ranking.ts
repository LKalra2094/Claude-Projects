import {
  YouTubeVideoDetails,
  YouTubeChannelDetails,
  RawSignals,
  NormalizedSignals,
  RankedVideo,
} from '@/types';
import { parseDuration } from './youtube';

// Stopwords to remove from query and description for overlap calculation
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
  'those', 'it', 'its', 'as', 'if', 'when', 'where', 'why', 'how',
  'what', 'which', 'who', 'whom', 'i', 'you', 'he', 'she', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
]);

const WEIGHTS = {
  commentDensity: 0.20,
  subscriberCount: 0.20,
  queryDescriptionOverlap: 0.20,
  viewCount: 0.20,
  freshness: 0.20,
};

// Constants for log normalization
const MAX_SUBSCRIBER_COUNT = 50_000_000; // 50M
const MAX_VIEW_COUNT = 1_000_000_000; // 1B
const MAX_AGE_DAYS = 3650; // 10 years

/**
 * Filter out videos that don't fit the educational use case.
 */
export function filterCandidates(videos: YouTubeVideoDetails[]): YouTubeVideoDetails[] {
  return videos.filter((video) => {
    // Filter: Made for kids
    if (video.status.madeForKids) return false;

    // Filter: Live stream or upcoming
    if (video.snippet.liveBroadcastContent !== 'none') return false;

    // Filter: Too short (< 2 minutes)
    const durationSeconds = parseDuration(video.contentDetails.duration);
    if (durationSeconds < 120) return false;

    return true;
  });
}

/**
 * Tokenize text: lowercase, split on non-alphanumeric, remove stopwords.
 */
function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return new Set(words.filter((word) => !STOPWORDS.has(word) && word.length > 1));
}

/**
 * Calculate query-description overlap: |intersection| / |queryTokens|
 */
function calculateOverlap(query: string, description: string): number {
  const queryTokens = tokenize(query);
  const descTokens = tokenize(description);

  if (queryTokens.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of queryTokens) {
    if (descTokens.has(token)) intersectionCount++;
  }

  return intersectionCount / queryTokens.size;
}

/**
 * Calculate days since a date.
 */
function daysSince(isoDate: string): number {
  const publishedDate = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Extract raw signals from video and channel data.
 */
export function extractRawSignals(
  video: YouTubeVideoDetails,
  channel: YouTubeChannelDetails | undefined,
  query: string
): RawSignals {
  const viewCount = Math.max(parseInt(video.statistics.viewCount || '0', 10), 1);
  const commentCount = parseInt(video.statistics.commentCount || '0', 10);
  const subscriberCount = channel?.statistics.hiddenSubscriberCount
    ? 0
    : parseInt(channel?.statistics.subscriberCount || '0', 10);

  return {
    commentDensity: commentCount / viewCount,
    subscriberCount,
    queryDescriptionOverlap: calculateOverlap(query, video.snippet.description),
    viewCount,
    freshness: daysSince(video.snippet.publishedAt),
  };
}

/**
 * Normalize signals to 0-1 scale.
 * Comment density uses min-max across the batch.
 * Others use fixed scales.
 */
export function normalizeSignals(
  rawSignals: RawSignals,
  minCommentDensity: number,
  maxCommentDensity: number
): NormalizedSignals {
  // Comment density: min-max normalization
  const commentDensityRange = maxCommentDensity - minCommentDensity;
  const normalizedCommentDensity =
    commentDensityRange > 0
      ? (rawSignals.commentDensity - minCommentDensity) / commentDensityRange
      : 0;

  // Subscriber count: log scale
  const normalizedSubscriberCount =
    Math.log10(rawSignals.subscriberCount + 1) / Math.log10(MAX_SUBSCRIBER_COUNT);

  // Query-description overlap: already 0-1
  const normalizedOverlap = rawSignals.queryDescriptionOverlap;

  // View count: log scale
  const normalizedViewCount =
    Math.log10(rawSignals.viewCount + 1) / Math.log10(MAX_VIEW_COUNT);

  // Freshness: recency decay (rawSignals.freshness is days since published)
  const normalizedFreshness = Math.max(0, 1 - rawSignals.freshness / MAX_AGE_DAYS);

  return {
    commentDensity: Math.min(1, Math.max(0, normalizedCommentDensity)),
    subscriberCount: Math.min(1, Math.max(0, normalizedSubscriberCount)),
    queryDescriptionOverlap: Math.min(1, Math.max(0, normalizedOverlap)),
    viewCount: Math.min(1, Math.max(0, normalizedViewCount)),
    freshness: Math.min(1, Math.max(0, normalizedFreshness)),
  };
}

/**
 * Calculate composite score from normalized signals.
 */
export function calculateCompositeScore(normalized: NormalizedSignals): number {
  return (
    normalized.commentDensity * WEIGHTS.commentDensity +
    normalized.subscriberCount * WEIGHTS.subscriberCount +
    normalized.queryDescriptionOverlap * WEIGHTS.queryDescriptionOverlap +
    normalized.viewCount * WEIGHTS.viewCount +
    normalized.freshness * WEIGHTS.freshness
  );
}

/**
 * Main ranking function: takes filtered videos + channel data, returns ranked results.
 */
export function rankVideos(
  videos: YouTubeVideoDetails[],
  channelMap: Map<string, YouTubeChannelDetails>,
  query: string
): RankedVideo[] {
  // Step 1: Extract raw signals for all videos
  const videosWithRawSignals = videos.map((video) => ({
    video,
    rawSignals: extractRawSignals(video, channelMap.get(video.snippet.channelId), query),
  }));

  // Step 2: Calculate min/max comment density for batch normalization
  const commentDensities = videosWithRawSignals.map((v) => v.rawSignals.commentDensity);
  const minCommentDensity = Math.min(...commentDensities);
  const maxCommentDensity = Math.max(...commentDensities);

  // Step 3: Normalize and score
  const rankedVideos: RankedVideo[] = videosWithRawSignals.map(({ video, rawSignals }) => {
    const normalizedSignals = normalizeSignals(rawSignals, minCommentDensity, maxCommentDensity);
    const compositeScore = calculateCompositeScore(normalizedSignals);

    return {
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.high?.url,
      publishedAt: video.snippet.publishedAt,
      durationSeconds: parseDuration(video.contentDetails.duration),
      viewCount: parseInt(video.statistics.viewCount || '0', 10),
      commentCount: parseInt(video.statistics.commentCount || '0', 10),
      subscriberCount: channelMap.get(video.snippet.channelId)?.statistics.hiddenSubscriberCount
        ? 0
        : parseInt(channelMap.get(video.snippet.channelId)?.statistics.subscriberCount || '0', 10),
      compositeScore,
      rawSignals,
      normalizedSignals,
    };
  });

  // Step 4: Sort by composite score descending
  rankedVideos.sort((a, b) => b.compositeScore - a.compositeScore);

  return rankedVideos;
}
