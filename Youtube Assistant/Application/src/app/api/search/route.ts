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

    console.log(`\n[search] ===== New search: "${query.trim()}" =====`);
    console.time('[search] total');

    // Step 1: Search YouTube (100 units)
    console.time('[search] youtube-search');
    const searchResults = await searchVideos(query.trim(), 50);
    console.timeEnd('[search] youtube-search');
    console.log(`[search] Found ${searchResults.length} search results`);

    const videoIds = searchResults.map((r) => r.id.videoId);

    if (videoIds.length === 0) {
      console.timeEnd('[search] total');
      return NextResponse.json({
        queryId: generateQueryId(),
        results: [],
        quotaUnitsUsed: QUOTA_COSTS.SEARCH,
      } as SearchResponse);
    }

    // Step 2: Get video details (1 unit)
    console.time('[search] video-details');
    const videoDetails = await getVideoDetails(videoIds);
    console.timeEnd('[search] video-details');
    console.log(`[search] Got details for ${videoDetails.length} videos`);

    // Step 3: Filter candidates (remove kids content, live streams, shorts)
    const filteredVideos = filterCandidates(videoDetails);
    console.log(`[search] ${filteredVideos.length} videos after filtering`);

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

      console.timeEnd('[search] total');
      return NextResponse.json({
        queryId,
        results: [],
        quotaUnitsUsed: quotaUsed,
      } as SearchResponse);
    }

    // Step 4: Get channel details for subscriber counts (1 unit)
    console.time('[search] channel-details');
    const uniqueChannelIds = [...new Set(filteredVideos.map((v) => v.snippet.channelId))];
    const channelDetails = await getChannelDetails(uniqueChannelIds);
    console.timeEnd('[search] channel-details');
    console.log(`[search] Got details for ${channelDetails.length} channels`);

    // Build channel map for quick lookup
    const channelMap = new Map<string, YouTubeChannelDetails>();
    channelDetails.forEach((channel) => {
      channelMap.set(channel.id, channel);
    });

    // Step 5: Rank videos (async for semantic similarity computation)
    console.time('[search] ranking');
    const rankedVideos = await rankVideos(filteredVideos, channelMap, query.trim());
    console.timeEnd('[search] ranking');

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

    console.timeEnd('[search] total');
    console.log(`[search] ===== Search complete =====\n`);

    return NextResponse.json({
      queryId,
      results: rankedVideos,
      quotaUnitsUsed: quotaUsed,
    } as SearchResponse);
  } catch (error) {
    console.error('[search] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
