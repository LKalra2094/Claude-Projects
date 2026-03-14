import pool from '@/lib/db';
import { WeightSet, WeightRecord } from '@/types';

export const DEFAULT_WEIGHTS: WeightSet = {
  commentDensity: 0.14,
  subscriberCount: 0.14,
  queryDescriptionOverlap: 0.25,
  viewCount: 0.14,
  freshness: 0.08,
  youtubeRank: 0.25,
};

/**
 * Get the currently active learned weights, or null if using defaults.
 */
export async function getActiveWeights(): Promise<WeightRecord | null> {
  const result = await pool.query(
    `SELECT id, weights, training_count, validation_acc, is_active, created_at
     FROM ranking_weights
     WHERE is_active = true
     ORDER BY created_at DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    weights: row.weights as WeightSet,
    trainingCount: row.training_count,
    validationAcc: row.validation_acc,
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
  };
}

/**
 * Save new weights and activate them.
 * Deactivates all previous weight records.
 */
export async function saveWeights(
  weights: WeightSet,
  trainingCount: number,
  validationAcc: number
): Promise<WeightRecord> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate all existing weights
    await client.query('UPDATE ranking_weights SET is_active = false');

    // Insert new active weights
    const result = await client.query(
      `INSERT INTO ranking_weights (weights, training_count, validation_acc, is_active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING id, weights, training_count, validation_acc, is_active, created_at`,
      [JSON.stringify(weights), trainingCount, validationAcc]
    );

    await client.query('COMMIT');

    const row = result.rows[0];
    return {
      id: row.id,
      weights: row.weights as WeightSet,
      trainingCount: row.training_count,
      validationAcc: row.validation_acc,
      isActive: row.is_active,
      createdAt: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get full weight history, newest first.
 */
export async function getWeightHistory(): Promise<WeightRecord[]> {
  const result = await pool.query(
    `SELECT id, weights, training_count, validation_acc, is_active, created_at
     FROM ranking_weights
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    weights: row.weights as WeightSet,
    trainingCount: row.training_count,
    validationAcc: row.validation_acc,
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
  }));
}

/**
 * Revert to default weights by deactivating all learned weights.
 */
export async function revertToDefaults(): Promise<void> {
  await pool.query('UPDATE ranking_weights SET is_active = false');
}
