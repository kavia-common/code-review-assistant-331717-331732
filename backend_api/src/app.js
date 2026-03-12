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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

module.exports = app;
