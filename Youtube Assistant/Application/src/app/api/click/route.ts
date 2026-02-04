import { NextRequest, NextResponse } from 'next/server';
import { addClickEvent } from '@/services/storage';
import { ClickRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ClickRequest = await request.json();
    const { queryId, videoId, clickedRank } = body;

    if (!queryId || !videoId || clickedRank === undefined) {
      return NextResponse.json(
        { error: 'queryId, videoId, and clickedRank are required' },
        { status: 400 }
      );
    }

    addClickEvent({
      queryId,
      videoId,
      clickedRank,
      clickedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Click API error:', error);
    return NextResponse.json(
      { error: 'Failed to save click event' },
      { status: 500 }
    );
  }
}
