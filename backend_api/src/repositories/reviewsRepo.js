'use strict';

const db = require('../adapters/db/postgres');

/**
 * Note on anonymous reviews:
 * - When auth is removed in the UI, userId may be null.
 * - This requires public.reviews.user_id to allow NULL in the DB schema.
 */

// PUBLIC_INTERFACE
async function createReview({ userId, language, code, title, status = 'completed' }) {
  /** Create a review row and return it. userId may be null for anonymous submissions. */
  const safeUserId = Number.isFinite(userId) ? userId : null;

  const result = await db.query(
    `INSERT INTO public.reviews (user_id, language, code, status, title)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, language, code, status, title, created_at, updated_at`,
    [safeUserId, language, code, status, title || null],
    { operation: 'reviews.create' }
  );
  return result.rows[0];
}

// PUBLIC_INTERFACE
async function createReviewResult({ reviewId, summary, issues, suggestions, rawResult, model }) {
  /** Create review_results row. Enforces 1:1 via unique index. */
  const result = await db.query(
    `INSERT INTO public.review_results (review_id, summary, issues, suggestions, raw_result, model)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, review_id, summary, issues, suggestions, raw_result, model, created_at`,
    [reviewId, summary || null, issues || null, suggestions || null, rawResult || null, model || null],
    { operation: 'reviewResults.create' }
  );
  return result.rows[0];
}

// PUBLIC_INTERFACE
async function listReviewsByUser({ userId, limit, offset }) {
  /**
   * List reviews for a user with their result (if present).
   * Returns array of { review, result } flattened fields.
   */
  const result = await db.query(
    `SELECT
        r.id AS review_id,
        r.user_id,
        r.language,
        r.status,
        r.title,
        r.created_at AS review_created_at,
        rr.id AS result_id,
        rr.summary,
        rr.issues,
        rr.suggestions,
        rr.raw_result,
        rr.model,
        rr.created_at AS result_created_at
     FROM public.reviews r
     LEFT JOIN public.review_results rr ON rr.review_id = r.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
    { operation: 'reviews.listByUser' }
  );
  return result.rows;
}

// PUBLIC_INTERFACE
async function getReviewByIdForUser({ reviewId, userId }) {
  /** Fetch a review (and its result) ensuring it belongs to the given user. Returns null if missing. */
  const result = await db.query(
    `SELECT
        r.id AS review_id,
        r.user_id,
        r.language,
        r.code,
        r.status,
        r.title,
        r.created_at AS review_created_at,
        r.updated_at AS review_updated_at,
        rr.id AS result_id,
        rr.summary,
        rr.issues,
        rr.suggestions,
        rr.raw_result,
        rr.model,
        rr.created_at AS result_created_at
     FROM public.reviews r
     LEFT JOIN public.review_results rr ON rr.review_id = r.id
     WHERE r.id = $1 AND r.user_id = $2
     LIMIT 1`,
    [reviewId, userId],
    { operation: 'reviews.getByIdForUser' }
  );
  return result.rows[0] || null;
}

/**
 * Anonymous history behavior:
 * - Without auth, we cannot scope to a user. We return the latest reviews (across all users/anonymous),
 *   which keeps the existing frontend "history" screen functional.
 * - In deployments where auth is re-enabled, the protected routes can call the user-scoped methods.
 */

// PUBLIC_INTERFACE
async function listReviews({ limit, offset }) {
  /**
   * List reviews across all users (and anonymous ones) with their result (if present).
   * Returns array of flattened fields similar to listReviewsByUser.
   */
  const result = await db.query(
    `SELECT
        r.id AS review_id,
        r.user_id,
        r.language,
        r.status,
        r.title,
        r.created_at AS review_created_at,
        rr.id AS result_id,
        rr.summary,
        rr.issues,
        rr.suggestions,
        rr.raw_result,
        rr.model,
        rr.created_at AS result_created_at
     FROM public.reviews r
     LEFT JOIN public.review_results rr ON rr.review_id = r.id
     ORDER BY r.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
    { operation: 'reviews.list' }
  );
  return result.rows;
}

// PUBLIC_INTERFACE
async function getReviewById({ reviewId }) {
  /** Fetch a review (and its result) by id without ownership enforcement. Returns null if missing. */
  const result = await db.query(
    `SELECT
        r.id AS review_id,
        r.user_id,
        r.language,
        r.code,
        r.status,
        r.title,
        r.created_at AS review_created_at,
        r.updated_at AS review_updated_at,
        rr.id AS result_id,
        rr.summary,
        rr.issues,
        rr.suggestions,
        rr.raw_result,
        rr.model,
        rr.created_at AS result_created_at
     FROM public.reviews r
     LEFT JOIN public.review_results rr ON rr.review_id = r.id
     WHERE r.id = $1
     LIMIT 1`,
    [reviewId],
    { operation: 'reviews.getById' }
  );
  return result.rows[0] || null;
}

module.exports = {
  createReview,
  createReviewResult,
  listReviewsByUser,
  getReviewByIdForUser,
  listReviews,
  getReviewById,
};
