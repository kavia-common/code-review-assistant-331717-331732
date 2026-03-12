'use strict';

const { verifyAccessToken } = require('../services/auth/jwt');

// PUBLIC_INTERFACE
function requireAuth(config) {
  /**
   * Express middleware factory enforcing Bearer JWT auth.
   *
   * Contract:
   * - Header: Authorization: Bearer <token>
   * - On success: sets req.user = { id: number, email: string }
   * - On failure: responds 401 with error message
   */
  return (req, res, next) => {
    const header = req.get('Authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing or invalid Authorization header (expected Bearer token)',
      });
    }

    try {
      const decoded = verifyAccessToken(token, config.jwt);
      const userId = Number(decoded.sub);
      if (!Number.isFinite(userId)) {
        return res.status(401).json({ status: 'error', message: 'Invalid token subject' });
      }
      req.user = { id: userId, email: decoded.email };
      return next();
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }
  };
}

module.exports = {
  requireAuth,
};
