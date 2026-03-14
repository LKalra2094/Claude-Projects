// scripts/migrate-v3.js
// Iteration 7: Add users table and user_id columns for per-user data
// Run once: DATABASE_URL=<url> node scripts/migrate-v3.js

const { Pool } = require('pg');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  console.error('ADMIN_EMAIL environment variable is required for migration.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL       PRIMARY KEY,
        email      TEXT         NOT NULL UNIQUE,
        name       TEXT,
        image      TEXT,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // 2. Insert admin user
    await client.query(`
      INSERT INTO users (email, name)
      VALUES ($1, 'Admin')
      ON CONFLICT (email) DO NOTHING
    `, [ADMIN_EMAIL]);

    // 3. Add user_id columns to data tables
    await client.query(`ALTER TABLE query_history ADD COLUMN IF NOT EXISTS user_id TEXT`);
    await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_id TEXT`);
    await client.query(`ALTER TABLE click_events ADD COLUMN IF NOT EXISTS user_id TEXT`);
    await client.query(`ALTER TABLE ranking_weights ADD COLUMN IF NOT EXISTS user_id TEXT`);

    // 4. Migrate existing data to admin user
    await client.query(`UPDATE query_history SET user_id = $1 WHERE user_id IS NULL`, [ADMIN_EMAIL]);
    await client.query(`UPDATE feedback SET user_id = $1 WHERE user_id IS NULL`, [ADMIN_EMAIL]);
    await client.query(`UPDATE click_events SET user_id = $1 WHERE user_id IS NULL`, [ADMIN_EMAIL]);
    await client.query(`UPDATE ranking_weights SET user_id = $1 WHERE user_id IS NULL`, [ADMIN_EMAIL]);

    // 5. Create indexes on user_id for faster lookups
    await client.query(`CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history (user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback (user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_click_events_user_id ON click_events (user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ranking_weights_user_id ON ranking_weights (user_id)`);

    await client.query('COMMIT');
    console.log('Migration v3 complete: users table + user_id columns on all data tables.');
    console.log(`All existing data assigned to admin: ${ADMIN_EMAIL}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration v3 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
