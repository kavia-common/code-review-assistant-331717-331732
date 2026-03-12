'use strict';

const reviewsRepo = require('../repositories/reviewsRepo');

// PUBLIC_INTERFACE
async function createReviewFlow({ userId, language, code, title }, { aiReviewer }) {
  /**
   * CreateReviewFlow
   *
   * Contract:
   * - Inputs: { userId?: number|null, language, code, title? }
   *   - userId is optional to support anonymous reviews when auth is disabled in the UI.
   * - Output: { reviewId, review, result }
   * - Side effects: inserts into public.reviews and public.review_results
   * - Errors: bubbles up DB / AI adapter errors (with boundary mapping in controller)
   */
  const safeUserId = Number.isFinite(userId) ? userId : null;
  console.log(`[flow] CreateReviewFlow start userId=${safeUserId || 'anonymous'} language=${language}`);

  const review = await reviewsRepo.createReview({
    userId: safeUserId,
    language,
    code,
    title,
    status: 'completed',
  });

  const aiResult = await aiReviewer.reviewCode({ language, code, title });

  const result = await reviewsRepo.createReviewResult({
    reviewId: review.id,
    summary: aiResult.summary,
    issues: aiResult.issues,
    suggestions: aiResult.suggestions,
    rawResult: aiResult.raw_result,
    model: aiResult.model,
  });

  console.log(
    `[flow] CreateReviewFlow success userId=${safeUserId || 'anonymous'} reviewId=${review.id}`
  );
  return { reviewId: review.id, review, result };
}

module.exports = {
  createReviewFlow,
};
