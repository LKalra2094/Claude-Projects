import pool from '@/lib/db';
import { NormalizedSignals, WeightSet } from '@/types';

const SIGNAL_KEYS: (keyof NormalizedSignals)[] = [
  'commentDensity',
  'subscriberCount',
  'queryDescriptionOverlap',
  'viewCount',
  'freshness',
  'youtubeRank',
];

const MIN_SAMPLES = 30;
const MIN_PER_CLASS = 5;
const MIN_WEIGHT = 0.03;
const MAX_WEIGHT = 0.50;
const LEARNING_RATE = 0.5;
const MAX_EPOCHS = 500;
const CONVERGENCE_THRESHOLD = 1e-6;
const VALIDATION_SPLIT = 0.2;
const MIN_VALIDATION_ACC = 0.65;

interface TrainingExample {
  signals: number[];
  label: number; // 1 = thumbs_up, 0 = thumbs_down
}

interface TrainResult {
  weights: WeightSet;
  trainingLoss: number;
  validationAcc: number;
  totalSamples: number;
  thumbsUpCount: number;
  thumbsDownCount: number;
  epochs: number;
  passedValidation: boolean;
}

function sigmoid(x: number): number {
  if (x > 20) return 1;
  if (x < -20) return 0;
  return 1 / (1 + Math.exp(-x));
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Project weights onto constrained simplex:
 * - Each weight in [MIN_WEIGHT, MAX_WEIGHT]
 * - All weights sum to 1
 */
function projectToSimplex(weights: number[]): number[] {
  const n = weights.length;
  const result = [...weights];

  // Iteratively clamp and redistribute
  for (let iter = 0; iter < 20; iter++) {
    // Clamp to bounds
    for (let i = 0; i < n; i++) {
      result[i] = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, result[i]));
    }

    // Redistribute to sum to 1
    const sum = result.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) < 1e-10) break;

    const diff = (sum - 1) / n;
    for (let i = 0; i < n; i++) {
      result[i] -= diff;
    }
  }

  // Final clamp and normalize
  for (let i = 0; i < n; i++) {
    result[i] = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, result[i]));
  }
  const finalSum = result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) {
    result[i] /= finalSum;
  }

  return result;
}

function weightsArrayToSet(arr: number[]): WeightSet {
  return {
    commentDensity: arr[0],
    subscriberCount: arr[1],
    queryDescriptionOverlap: arr[2],
    viewCount: arr[3],
    freshness: arr[4],
    youtubeRank: arr[5],
  };
}

function weightsSetToArray(ws: WeightSet): number[] {
  return SIGNAL_KEYS.map((k) => ws[k]);
}

/**
 * Fetch training data from feedback table.
 * Only includes rows with normalized_signals and thumbs_up/thumbs_down feedback.
 * Uses most recent feedback per (query_id, video_id).
 */
export async function fetchTrainingData(): Promise<{
  examples: TrainingExample[];
  thumbsUpCount: number;
  thumbsDownCount: number;
}> {
  const result = await pool.query(`
    SELECT DISTINCT ON (query_id, video_id)
      feedback, normalized_signals
    FROM feedback
    WHERE normalized_signals IS NOT NULL
      AND feedback IN ('thumbs_up', 'thumbs_down')
    ORDER BY query_id, video_id, feedback_at DESC
  `);

  let thumbsUpCount = 0;
  let thumbsDownCount = 0;
  const examples: TrainingExample[] = [];

  for (const row of result.rows) {
    const ns = row.normalized_signals as NormalizedSignals;
    const label = row.feedback === 'thumbs_up' ? 1 : 0;
    if (label === 1) thumbsUpCount++;
    else thumbsDownCount++;

    examples.push({
      signals: SIGNAL_KEYS.map((k) => ns[k]),
      label,
    });
  }

  return { examples, thumbsUpCount, thumbsDownCount };
}

/**
 * Split data into train/validation sets.
 */
function splitData(examples: TrainingExample[]): {
  train: TrainingExample[];
  validation: TrainingExample[];
} {
  const shuffled = [...examples].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * (1 - VALIDATION_SPLIT));
  return {
    train: shuffled.slice(0, splitIdx),
    validation: shuffled.slice(splitIdx),
  };
}

/**
 * Compute accuracy on a dataset.
 */
function computeAccuracy(weights: number[], data: TrainingExample[]): number {
  if (data.length === 0) return 0;
  let correct = 0;
  for (const ex of data) {
    const pred = sigmoid(dotProduct(weights, ex.signals)) > 0.5 ? 1 : 0;
    if (pred === ex.label) correct++;
  }
  return correct / data.length;
}

/**
 * Train weights using gradient descent on logistic loss.
 */
export async function trainWeights(
  initialWeights: WeightSet
): Promise<TrainResult> {
  const { examples, thumbsUpCount, thumbsDownCount } = await fetchTrainingData();
  const totalSamples = examples.length;

  if (totalSamples < MIN_SAMPLES) {
    throw new Error(
      `Insufficient data: ${totalSamples} samples (need ${MIN_SAMPLES}). ` +
      `${thumbsUpCount} thumbs up, ${thumbsDownCount} thumbs down.`
    );
  }
  if (thumbsUpCount < MIN_PER_CLASS || thumbsDownCount < MIN_PER_CLASS) {
    throw new Error(
      `Need at least ${MIN_PER_CLASS} of each class. ` +
      `Got ${thumbsUpCount} thumbs up, ${thumbsDownCount} thumbs down.`
    );
  }

  const { train, validation } = splitData(examples);
  let weights = projectToSimplex(weightsSetToArray(initialWeights));
  let prevLoss = Infinity;
  let epochs = 0;

  for (let epoch = 0; epoch < MAX_EPOCHS; epoch++) {
    // Compute gradients
    const gradient = new Array(6).fill(0);
    let loss = 0;

    for (const ex of train) {
      const z = dotProduct(weights, ex.signals);
      const pred = sigmoid(z);
      const error = pred - ex.label;

      for (let i = 0; i < 6; i++) {
        gradient[i] += error * ex.signals[i];
      }

      // Binary cross-entropy loss
      loss -= ex.label * Math.log(pred + 1e-15) + (1 - ex.label) * Math.log(1 - pred + 1e-15);
    }

    loss /= train.length;
    for (let i = 0; i < 6; i++) {
      gradient[i] /= train.length;
    }

    // Update weights
    for (let i = 0; i < 6; i++) {
      weights[i] -= LEARNING_RATE * gradient[i];
    }

    // Project back to constrained simplex
    weights = projectToSimplex(weights);
    epochs = epoch + 1;

    // Check convergence
    if (Math.abs(prevLoss - loss) < CONVERGENCE_THRESHOLD) break;
    prevLoss = loss;
  }

  const validationAcc = computeAccuracy(weights, validation);
  const passedValidation = validationAcc >= MIN_VALIDATION_ACC;

  return {
    weights: weightsArrayToSet(weights),
    trainingLoss: prevLoss,
    validationAcc,
    totalSamples,
    thumbsUpCount,
    thumbsDownCount,
    epochs,
    passedValidation,
  };
}

export { SIGNAL_KEYS, MIN_SAMPLES, MIN_PER_CLASS, MIN_VALIDATION_ACC, weightsSetToArray, weightsArrayToSet };
