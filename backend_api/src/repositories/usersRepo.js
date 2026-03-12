'use strict';

const db = require('../adapters/db/postgres');

// PUBLIC_INTERFACE
async function findUserByEmail(email) {
  /** Find a user by case-insensitive email. Returns null if not found. */
  const result = await db.query(
    'SELECT id, email, password_hash, created_at, updated_at FROM public.users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
    { operation: 'users.findByEmail' }
  );
  return result.rows[0] || null;
}

// PUBLIC_INTERFACE
async function createUser({ email, passwordHash }) {
  /**
   * Create a new user.
   *
   * Errors:
   * - may throw on unique constraint violation (email already exists)
   */
  const result = await db.query(
    'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at, updated_at',
    [email, passwordHash],
    { operation: 'users.create' }
  );
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
};
