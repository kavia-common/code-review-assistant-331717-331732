'use strict';

const jwt = require('jsonwebtoken');

// PUBLIC_INTERFACE
function signAccessToken({ userId, email }, jwtConfig) {
  /**
   * Create a signed JWT access token.
   *
   * Contract:
   * - Inputs: {userId, email}, jwtConfig {secret, issuer, audience, expiresIn}
   * - Output: string token
   */
  return jwt.sign(
    {
      sub: String(userId),
      email,
    },
    jwtConfig.secret,
    {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      expiresIn: jwtConfig.expiresIn,
    }
  );
}

// PUBLIC_INTERFACE
function verifyAccessToken(token, jwtConfig) {
  /**
   * Verify JWT access token.
   *
   * Contract:
   * - Inputs: token string, jwtConfig
   * - Output: decoded payload { sub, email, iat, exp, iss, aud }
   * - Errors: throws jsonwebtoken errors on invalid token
   */
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
