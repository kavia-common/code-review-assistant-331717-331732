'use strict';

const { Pool } = require('pg');

let pool = null;

// PUBLIC_INTERFACE
function initPostgresPool(config) {
  /**
   * Initialize the shared Postgres pool.
   *
   * Contract:
   * - Inputs: config.postgres.{url,user,password,db,port}
   * - Side effects: creates a singleton connection pool.
   * - Errors: throws if called twice with different parameters (guarded by singleton).
   */
  if (pool) {
    return pool;
  }

  // NOTE: db_connection.txt shows a canonical connection string, but we must use env vars per platform rules.
  pool = new Pool({
    host: config.postgres.url,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.db,
    port: config.postgres.port,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (err) => {
    // Ensure unexpected pool errors are visible.
    console.error('[postgres] unexpected pool error', err);
  });

  return pool;
}

// PUBLIC_INTERFACE
async function query(text, params, ctx = {}) {
  /**
   * Execute a SQL query with consistent logging context.
   *
   * Contract:
   * - Inputs: text (string), params (array), ctx.operation (string, optional)
   * - Output: pg Result
   * - Errors: throws with context; does not swallow errors.
   */
  if (!pool) {
    throw new Error('Postgres pool not initialized. Call initPostgresPool(config) at startup.');
  }
  const startedAt = Date.now();
  try {
    const result = await pool.query(text, params);
    const durationMs = Date.now() - startedAt;
    if (ctx.operation) {
      console.log(`[db] op=${ctx.operation} durationMs=${durationMs} rows=${result.rowCount}`);
    }
    return result;
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    console.error(
      `[db] error op=${ctx.operation || 'unknown'} durationMs=${durationMs} message=${err.message}`
    );
    throw err;
  }
}

module.exports = {
  initPostgresPool,
  query,
};
