// scripts/migrate-v2.js
// Iteration 5: Add normalized_signals column and ranking_weights table
// Run once: DATABASE_URL=<url> node scripts/migrate-v2.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add normalized_signals column to feedback table
    await client.query(`
      ALTER TABLE feedback
      ADD COLUMN IF NOT EXISTS normalized_signals JSONB
    `);

    // Create ranking_weights table for learned weights
    await client.query(`
      CREATE TABLE IF NOT EXISTS ranking_weights (
        id              SERIAL           PRIMARY KEY,
        weights         JSONB            NOT NULL,
        training_count  INTEGER          NOT NULL,
        validation_acc  DOUBLE PRECISION NOT NULL,
        is_active       BOOLEAN          NOT NULL DEFAULT false,
        created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('Migration v2 complete: normalized_signals column + ranking_weights table.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration v2 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
