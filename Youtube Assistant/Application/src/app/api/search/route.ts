import { NextRequest, NextResponse } from 'next/server';
import {
  searchVideos,
  getVideoDetails,
  getChannelDetails,
  QUOTA_COSTS,
} from '@/services/youtube';
import { filterCandidates, rankVideos } from '@/services/ranking';
import {
  generateQueryId,
  addQueryHistory,
  incrementQuota,
} from '@/services/storage';
import { SearchRequest, SearchResponse, YouTubeChannelDetails } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Step 1: Search YouTube (100 units)
    const searchResults = await searchVideos(query.trim(), 50);
    const videoIds = searchResults.map((r) => r.id.videoId);

    if (videoIds.length === 0) {
      return NextResponse.json({
        queryId: generateQueryId(),
        results: [],
        quotaUnitsUsed: QUOTA_COSTS.SEARCH,
      } as SearchResponse);
    }

    // Step 2: Get video details (1 unit)
    const videoDetails = await getVideoDetails(videoIds);

    // Step 3: Filter candidates (remove kids content, live streams, shorts)
    const filteredVideos = filterCandidates(videoDetails);

    if (filteredVideos.length === 0) {
      const queryId = generateQueryId();
      const quotaUsed = QUOTA_COSTS.SEARCH + QUOTA_COSTS.VIDEOS_LIST;
      incrementQuota(quotaUsed);

      addQueryHistory({
        queryId,
        query: query.trim(),
        executedAt: new Date().toISOString(),
        resultCount: 0,
        topVideos: [],
      });

      return NextResponse.json({
        queryId,
        results: [],
        quotaUnitsUsed: quotaUsed,
      } as SearchResponse);
    }

    // Step 4: Get channel details for subscriber counts (1 unit)
    const uniqueChannelIds = [...new Set(filteredVideos.map((v) => v.snippet.channelId))];
    const channelDetails = await getChannelDetails(uniqueChannelIds);

    // Build channel map for quick lookup
    const channelMap = new Map<string, YouTubeChannelDetails>();
    channelDetails.forEach((channel) => {
      channelMap.set(channel.id, channel);
    });

    // Step 5: Rank videos (async for semantic similarity computation)
    const rankedVideos = await rankVideos(filteredVideos, channelMap, query.trim());

    // Step 6: Generate query ID and save to storage
    const queryId = generateQueryId();
    const quotaUsed = QUOTA_COSTS.SEARCH + QUOTA_COSTS.VIDEOS_LIST + QUOTA_COSTS.CHANNELS_LIST;

    incrementQuota(quotaUsed);

    addQueryHistory({
      queryId,
      query: query.trim(),
      executedAt: new Date().toISOString(),
      resultCount: rankedVideos.length,
      topVideos: rankedVideos.slice(0, 3).map((v) => v.videoId),
    });

    return NextResponse.json({
      queryId,
      results: rankedVideos,
      quotaUnitsUsed: quotaUsed,
    } as SearchResponse);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
