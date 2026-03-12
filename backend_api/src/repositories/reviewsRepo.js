'use strict';

const db = require('../adapters/db/postgres');

// PUBLIC_INTERFACE
async function createReview({ userId, language, code, title, status = 'completed' }) {
  /** Create a review row and return it. */
  const result = await db.query(
    `INSERT INTO public.reviews (user_id, language, code, status, title)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, language, code, status, title, created_at, updated_at`,
    [userId, language, code, status, title || null],
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

module.exports = {
  createReview,
  createReviewResult,
  listReviewsByUser,
  getReviewByIdForUser,
};
