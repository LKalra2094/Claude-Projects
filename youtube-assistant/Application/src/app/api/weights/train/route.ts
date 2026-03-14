import { NextRequest, NextResponse } from 'next/server';
import { trainWeights } from '@/services/weightLearning';
import { getActiveWeights, saveWeights, revertToDefaults, DEFAULT_WEIGHTS } from '@/services/weightStorage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dryRun = false, action } = body;

    // Handle revert action
    if (action === 'revert') {
      await revertToDefaults();
      return NextResponse.json({
        success: true,
        message: 'Reverted to default weights',
        weights: DEFAULT_WEIGHTS,
      });
    }

    // Get current weights as starting point
    const activeRecord = await getActiveWeights();
    const currentWeights = activeRecord ? activeRecord.weights : DEFAULT_WEIGHTS;

    // Train
    const result = await trainWeights(currentWeights);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        proposed: result.weights,
        current: currentWeights,
        defaultWeights: DEFAULT_WEIGHTS,
        trainingLoss: result.trainingLoss,
        validationAcc: result.validationAcc,
        totalSamples: result.totalSamples,
        thumbsUpCount: result.thumbsUpCount,
        thumbsDownCount: result.thumbsDownCount,
        epochs: result.epochs,
        passedValidation: result.passedValidation,
      });
    }

    if (!result.passedValidation) {
      return NextResponse.json({
        success: false,
        message: `Validation accuracy too low: ${(result.validationAcc * 100).toFixed(1)}% (need 65%). Weights not activated.`,
        proposed: result.weights,
        validationAcc: result.validationAcc,
        totalSamples: result.totalSamples,
      }, { status: 422 });
    }

    // Save and activate
    const record = await saveWeights(
      result.weights,
      result.totalSamples,
      result.validationAcc
    );

    return NextResponse.json({
      success: true,
      message: 'New weights trained and activated',
      record,
      trainingLoss: result.trainingLoss,
      validationAcc: result.validationAcc,
      epochs: result.epochs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Training failed';
    console.error('Weight training error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
