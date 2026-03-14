import {
  YouTubeSearchResult,
  YouTubeVideoDetails,
  YouTubeChannelDetails,
} from '@/types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }
  return key;
}

/**
 * Search for videos matching a query.
 * Cost: 100 quota units per call.
 */
export async function searchVideos(
  query: string,
  maxResults: number = 50
): Promise<YouTubeSearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: maxResults.toString(),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube search failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.items as YouTubeSearchResult[];
}

/**
 * Get detailed information for a batch of videos.
 * Cost: 1 quota unit per call (up to 50 video IDs).
 */
export async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoDetails[]> {
  if (videoIds.length === 0) return [];
  if (videoIds.length > 50) {
    throw new Error('Cannot fetch more than 50 videos at once');
  }

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails,status',
    id: videoIds.join(','),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube videos.list failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.items as YouTubeVideoDetails[];
}

/**
 * Get channel details for a batch of channels.
 * Cost: 1 quota unit per call (up to 50 channel IDs).
 */
export async function getChannelDetails(
  channelIds: string[]
): Promise<YouTubeChannelDetails[]> {
  if (channelIds.length === 0) return [];
  if (channelIds.length > 50) {
    throw new Error('Cannot fetch more than 50 channels at once');
  }

  const params = new URLSearchParams({
    part: 'statistics',
    id: channelIds.join(','),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube channels.list failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.items as YouTubeChannelDetails[];
}

/**
 * Parse ISO 8601 duration (e.g., "PT38M12S") to seconds.
 */
export function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Quota cost constants for tracking.
 */
export const QUOTA_COSTS = {
  SEARCH: 100,
  VIDEOS_LIST: 1,
  CHANNELS_LIST: 1,
} as const;
