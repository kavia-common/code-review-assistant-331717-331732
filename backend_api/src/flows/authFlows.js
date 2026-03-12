'use strict';

const bcrypt = require('bcryptjs');
const usersRepo = require('../repositories/usersRepo');
const { signAccessToken } = require('../services/auth/jwt');

// PUBLIC_INTERFACE
async function signupFlow({ email, password }, { config }) {
  /**
   * SignupFlow
   *
   * Contract:
   * - Inputs: {email, password}
   * - Output: { user: {id, email}, accessToken }
   * - Errors:
   *   - throws Error('EMAIL_ALREADY_EXISTS') if user already exists
   */
  console.log(`[flow] SignupFlow start email=${email}`);

  const existing = await usersRepo.findUserByEmail(email);
  if (existing) {
    const err = new Error('EMAIL_ALREADY_EXISTS');
    err.code = 'EMAIL_ALREADY_EXISTS';
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await usersRepo.createUser({ email, passwordHash });

  const accessToken = signAccessToken({ userId: user.id, email: user.email }, config.jwt);

  console.log(`[flow] SignupFlow success userId=${user.id}`);
  return {
    user: { id: user.id, email: user.email },
    accessToken,
  };
}

// PUBLIC_INTERFACE
async function loginFlow({ email, password }, { config }) {
  /**
   * LoginFlow
   *
   * Contract:
   * - Inputs: {email, password}
   * - Output: { user: {id, email}, accessToken }
   * - Errors:
   *   - throws Error('INVALID_CREDENTIALS') if email/password mismatch
   */
  console.log(`[flow] LoginFlow start email=${email}`);

  const user = await usersRepo.findUserByEmail(email);
  if (!user) {
    const err = new Error('INVALID_CREDENTIALS');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error('INVALID_CREDENTIALS');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email }, config.jwt);
  console.log(`[flow] LoginFlow success userId=${user.id}`);

  return {
    user: { id: user.id, email: user.email },
    accessToken,
  };
}

module.exports = {
  signupFlow,
  loginFlow,
};
