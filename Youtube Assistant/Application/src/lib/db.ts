import { Pool } from 'pg';

declare global {
  // Prevents duplicate pool creation during Next.js hot reload
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Add it to .env.local for development or to Vercel environment variables for production.'
    );
  }

  const newPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Set session timezone to UTC so ::date casts match Node.js toISOString() dates
  newPool.on('connect', (client) => {
    client.query("SET timezone = 'UTC'");
  });

  return newPool;
}

// Singleton: reuse pool across hot reloads in dev; fresh in prod
const pool: Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (global.__pgPool ?? (global.__pgPool = createPool()));

export default pool;
