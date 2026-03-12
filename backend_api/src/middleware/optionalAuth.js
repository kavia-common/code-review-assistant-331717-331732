'use strict';

const { verifyAccessToken } = require('../services/auth/jwt');

/**
 * Express middleware factory that *optionally* parses a Bearer JWT.
 *
 * Differences vs requireAuth():
 * - Missing/invalid tokens do NOT block the request.
 * - If a valid token is present, sets req.user = { id, email }.
 * - If no valid token, sets req.user = null.
 */

// PUBLIC_INTERFACE
function optionalAuth(config) {
  /**
   * Optional authentication middleware.
   *
   * Contract:
   * - Header: Authorization: Bearer <token> (optional)
   * - On success: req.user = { id: number, email: string }
   * - If missing/invalid: req.user = null and continue
   */
  return (req, res, next) => {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');

    // No auth header (or wrong scheme) => anonymous
    if (scheme !== 'Bearer' || !token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token, config.jwt);
      const userId = Number(decoded.sub);

      if (!Number.isFinite(userId)) {
        // Treat malformed token as anonymous (do not block request)
        req.user = null;
        return next();
      }

      req.user = { id: userId, email: decoded.email };
      return next();
    } catch (_err) {
      // Invalid/expired token => anonymous (do not block request)
      req.user = null;
      return next();
    }
  };
}

module.exports = {
  optionalAuth,
};
