// scripts/migrate.js
// Run once: DATABASE_URL=<url> node scripts/migrate.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS query_history (
        query_id     TEXT        PRIMARY KEY,
        query        TEXT        NOT NULL,
        executed_at  TIMESTAMPTZ NOT NULL,
        result_count INTEGER     NOT NULL,
        top_videos   TEXT[]      NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id              SERIAL           PRIMARY KEY,
        query_id        TEXT             NOT NULL,
        video_id        TEXT             NOT NULL,
        feedback        TEXT             NOT NULL
          CHECK (feedback IN ('thumbs_up', 'thumbs_down', 'none')),
        composite_score DOUBLE PRECISION NOT NULL,
        raw_signals     JSONB            NOT NULL,
        feedback_at     TIMESTAMPTZ      NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_query_video
        ON feedback (query_id, video_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS click_events (
        id           SERIAL      PRIMARY KEY,
        query_id     TEXT        NOT NULL,
        video_id     TEXT        NOT NULL,
        clicked_rank INTEGER     NOT NULL,
        clicked_at   TIMESTAMPTZ NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_click_events_query_id
        ON click_events (query_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS quota_log (
        date        DATE    PRIMARY KEY,
        units_used  INTEGER NOT NULL DEFAULT 0
      )
    `);

    await client.query('COMMIT');
    console.log('Migration complete: all tables and indexes created.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
