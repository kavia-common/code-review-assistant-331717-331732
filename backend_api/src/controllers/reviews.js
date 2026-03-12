'use strict';

const reviewsRepo = require('../repositories/reviewsRepo');
const { createReviewFlow } = require('../flows/reviewFlows');

class ReviewsController {
  constructor({ aiReviewer }) {
    this.aiReviewer = aiReviewer;
  }

  /**
   * @swagger
   * /review:
   *   post:
   *     tags: [Reviews]
   *     summary: Submit code for AI review
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [language, code]
   *             properties:
   *               language:
   *                 type: string
   *                 example: javascript
   *               title:
   *                 type: string
   *                 example: "Refactor auth middleware"
   *               code:
   *                 type: string
   *                 example: "function add(a,b){return a+b}"
   *     responses:
   *       201:
   *         description: Review created and result generated
   *       401:
   *         description: Unauthorized
   */
  async create(req, res, next) {
    try {
      const { language, code, title } = req.body;
      const userId = req.user.id;

      const flowResult = await createReviewFlow(
        { userId, language, code, title },
        { aiReviewer: this.aiReviewer }
      );

      return res.status(201).json({
        status: 'ok',
        reviewId: flowResult.reviewId,
        review: {
          id: flowResult.review.id,
          language: flowResult.review.language,
          status: flowResult.review.status,
          title: flowResult.review.title,
          created_at: flowResult.review.created_at,
        },
        result: flowResult.result,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /reviews:
   *   get:
   *     tags: [Reviews]
   *     summary: List review history for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *           minimum: 0
   *     responses:
   *       200:
   *         description: List of reviews
   *       401:
   *         description: Unauthorized
   */
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit, offset } = req.query;

      const rows = await reviewsRepo.listReviewsByUser({ userId, limit, offset });
      const items = rows.map((r) => ({
        id: r.review_id,
        language: r.language,
        status: r.status,
        title: r.title,
        created_at: r.review_created_at,
        result: r.result_id
          ? {
              id: r.result_id,
              summary: r.summary,
              issues: r.issues,
              suggestions: r.suggestions,
              raw_result: r.raw_result,
              model: r.model,
              created_at: r.result_created_at,
            }
          : null,
      }));

      return res.status(200).json({ status: 'ok', items, limit, offset });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @swagger
   * /review/{id}:
   *   get:
   *     tags: [Reviews]
   *     summary: Get a single review by id
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Review detail (including code and AI result)
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Not found
   */
  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const reviewId = Number(req.params.id);

      const row = await reviewsRepo.getReviewByIdForUser({ reviewId, userId });
      if (!row) {
        return res.status(404).json({ status: 'error', message: 'Review not found' });
      }

      return res.status(200).json({
        status: 'ok',
        review: {
          id: row.review_id,
          user_id: row.user_id,
          language: row.language,
          code: row.code,
          status: row.status,
          title: row.title,
          created_at: row.review_created_at,
          updated_at: row.review_updated_at,
        },
        result: row.result_id
          ? {
              id: row.result_id,
              review_id: row.review_id,
              summary: row.summary,
              issues: row.issues,
              suggestions: row.suggestions,
              raw_result: row.raw_result,
              model: row.model,
              created_at: row.result_created_at,
            }
          : null,
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = {
  ReviewsController,
};
