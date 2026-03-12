const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

const { loadConfig } = require('./config');
const { initPostgresPool } = require('./adapters/db/postgres');
const { createAiReviewer } = require('./adapters/ai/reviewAdapter');

// Initialize express app
const app = express();

// Initialize dependencies once (Flow contract: no deep modules read env directly)
const config = loadConfig();
initPostgresPool(config);
const aiReviewer = createAiReviewer(config);

app.locals.deps = {
  config,
  aiReviewer,
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: (process.env.ALLOWED_METHODS || 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
      .split(',')
      .map((s) => s.trim()),
    allowedHeaders: (process.env.ALLOWED_HEADERS || 'Content-Type,Authorization')
      .split(',')
      .map((s) => s.trim()),
    maxAge: Number(process.env.CORS_MAX_AGE || '3600'),
  })
);

app.set('trust proxy', true);
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) || (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/', routes);

/**
 * Error handling middleware
 *
 * Goals:
 * - Provide actionable errors for common operational failures (e.g., DB schema not migrated)
 * - Avoid leaking secrets or internal stack traces to clients
 * - Keep logs rich enough to debug in production
 */
app.use((err, req, res, next) => {
  const isPgError = err && typeof err === 'object' && typeof err.code === 'string';

  // Postgres: undefined_table (missing relation) => most commonly migrations not applied.
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (isPgError && err.code === '42P01') {
    console.error('[error] postgres.undefined_table', {
      code: err.code,
      message: err.message,
      routine: err.routine,
      where: err.where,
      detail: err.detail,
    });

    return res.status(503).json({
      status: 'error',
      message:
        'Database schema is not ready (missing table). Apply DB migrations and retry.',
    });
  }

  // If upstream middleware sets a statusCode, respect it.
  const statusCode =
    typeof err.statusCode === 'number' && err.statusCode >= 400 ? err.statusCode : 500;

  console.error('[error] unhandled', {
    statusCode,
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    pgCode: isPgError ? err.code : undefined,
  });

  return res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;
