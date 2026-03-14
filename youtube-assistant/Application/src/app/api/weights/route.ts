import { NextResponse } from 'next/server';
import { getActiveWeights, getWeightHistory, DEFAULT_WEIGHTS } from '@/services/weightStorage';
import { fetchTrainingData } from '@/services/weightLearning';

export async function GET() {
  try {
    const [activeRecord, history, trainingData] = await Promise.all([
      getActiveWeights(),
      getWeightHistory(),
      fetchTrainingData(),
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
