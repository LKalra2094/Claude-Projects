import { NextRequest, NextResponse } from 'next/server';
import { getActiveWeights, getWeightHistory, DEFAULT_WEIGHTS } from '@/services/weightStorage';
import { fetchTrainingData } from '@/services/weightLearning';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can view another user's weights
    const { searchParams } = new URL(request.url);
    const targetUserId = user.isAdmin && searchParams.get('userId')
      ? searchParams.get('userId')!
      : user.email;

    const [activeRecord, history, trainingData] = await Promise.all([
      getActiveWeights(targetUserId),
      getWeightHistory(targetUserId),
      fetchTrainingData(targetUserId),
    ]);

    return NextResponse.json({
      source: activeRecord ? 'learned' : 'default',
      weights: activeRecord ? activeRecord.weights : DEFAULT_WEIGHTS,
      defaultWeights: DEFAULT_WEIGHTS,
      activeRecord,
      history,
      dataStats: {
        total: trainingData.examples.length,
        thumbsUp: trainingData.thumbsUpCount,
        thumbsDown: trainingData.thumbsDownCount,
      },
    });
  } catch (error) {
    console.error('Weights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weights' },
      { status: 500 }
    );
  }
}
