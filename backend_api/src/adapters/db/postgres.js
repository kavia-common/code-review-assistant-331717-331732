'use strict';

const { Pool } = require('pg');

let pool = null;

/**
 * Parse POSTGRES_URL which may be either:
 * - a full connection string (e.g. "postgresql://localhost:5000/myapp"), OR
 * - a hostname (e.g. "localhost")
 *
 * We support both to avoid fragile runtime coupling across containers/environments.
 */
function parsePostgresUrl(urlValue) {
  if (!urlValue || typeof urlValue !== 'string') return null;

  const trimmed = urlValue.trim();
  if (!trimmed) return null;

  // If it looks like a URL, parse it.
  if (/^postgres(ql)?:\/\//i.test(trimmed)) {
    // URL parsing is safe and built-in in Node.js.
    const { URL } = require('url');
    const u = new URL(trimmed);

    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : null,
      databaseFromUrl: u.pathname ? u.pathname.replace(/^\//, '') : null,
      ssl: u.searchParams.get('sslmode') === 'require',
    };
  }

  // Otherwise treat it as a hostname.
  return { host: trimmed, port: null, databaseFromUrl: null, ssl: false };
}

// PUBLIC_INTERFACE
function initPostgresPool(config) {
  /**
   * Initialize the shared Postgres pool.
   *
   * Contract:
   * - Inputs: config.postgres.{url,user,password,db,port}
   *   - url may be a hostname OR a full connection string (postgresql://...)
   * - Side effects: creates a singleton connection pool.
   * - Errors: throws if called before config is validated (loadConfig does validation).
   */
  if (pool) {
    return pool;
  }

  const parsed = parsePostgresUrl(config.postgres.url);
  if (!parsed || !parsed.host) {
    throw new Error('Invalid POSTGRES_URL: expected hostname or postgresql:// connection string');
  }

  const finalPort = Number.isFinite(parsed.port) ? parsed.port : config.postgres.port;
  const finalDb = parsed.databaseFromUrl || config.postgres.db;

  // We intentionally do NOT read env vars here; all config comes from `loadConfig()`.
  pool = new Pool({
    host: parsed.host,
    user: config.postgres.user,
    password: config.postgres.password,
    database: finalDb,
    port: finalPort,
    ssl: parsed.ssl || false,
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
