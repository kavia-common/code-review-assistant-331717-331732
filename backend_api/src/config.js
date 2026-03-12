'use strict';

/**
 * Application configuration.
 *
 * Contract:
 * - Reads configuration from process.env once at startup.
 * - Exposes normalized config values to downstream layers (no other module should read env directly).
 * - Throws on missing required configuration, except where a safe default exists.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, defaultValue) {
  const value = process.env[name];
  return value ? value : defaultValue;
}

/**
 * JWT config
 * - JWT_SECRET must be set in production. For dev we allow a deterministic fallback, but we still recommend setting it.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  // Safe-ish dev fallback (not secure for production); explicitly documented via code comments.
  return 'dev-insecure-jwt-secret-change-me';
}

// PUBLIC_INTERFACE
function loadConfig() {
  /** Load and validate config. */
  return {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    port: Number(optionalEnv('PORT', '3000')),
    host: optionalEnv('HOST', '0.0.0.0'),

    // Database (required)
    postgres: {
      url: requireEnv('POSTGRES_URL'),
      user: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
      db: requireEnv('POSTGRES_DB'),
      port: Number(requireEnv('POSTGRES_PORT')),
    },

    // Auth
    jwt: {
      secret: getJwtSecret(),
      issuer: optionalEnv('JWT_ISSUER', 'code-review-assistant'),
      audience: optionalEnv('JWT_AUDIENCE', 'code-review-assistant-frontend'),
      expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    },

    // AI review adapter selection
    ai: {
      provider: optionalEnv('AI_PROVIDER', 'stub'), // stub | openai (future)
      // Future: OPENAI_API_KEY, etc (not required for stub)
    },
  };
}

module.exports = {
  loadConfig,
};
