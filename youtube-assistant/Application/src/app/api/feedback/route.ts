import { NextRequest, NextResponse } from 'next/server';
import { addFeedback } from '@/services/storage';
import { FeedbackRequest } from '@/types';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FeedbackRequest = await request.json();
    const { queryId, videoId, feedback, compositeScore, rawSignals, normalizedSignals } = body;

    if (!queryId || !videoId || !feedback) {
      return NextResponse.json(
        { error: 'queryId, videoId, and feedback are required' },
        { status: 400 }
      );
    }

    if (!['thumbs_up', 'thumbs_down', 'none'].includes(feedback)) {
      return NextResponse.json(
        { error: 'feedback must be thumbs_up, thumbs_down, or none' },
        { status: 400 }
      );
    }

    await addFeedback(user.email, {
      queryId,
      videoId,
      feedback,
      compositeScore,
      rawSignals,
      normalizedSignals,
      feedbackAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}
