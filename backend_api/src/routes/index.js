'use strict';

const express = require('express');
const healthController = require('../controllers/health');
const { AuthController } = require('../controllers/auth');
const { ReviewsController } = require('../controllers/reviews');
const { getSchemas } = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const schemas = getSchemas();

// Health endpoint
/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

// Dependency injection via app.locals (configured in app.js)
function getDeps(req) {
  return req.app.locals.deps;
}

// Auth routes
router.post(
  '/auth/signup',
  validate({ bodySchema: schemas.authSignup }),
  async (req, res, next) => {
    const { config } = getDeps(req);
    const controller = new AuthController({ config });
    return controller.signup(req, res, next);
  }
);

router.post(
  '/auth/login',
  validate({ bodySchema: schemas.authLogin }),
  async (req, res, next) => {
    const { config } = getDeps(req);
    const controller = new AuthController({ config });
    return controller.login(req, res, next);
  }
);

// Review routes (protected)
router.post(
  '/review',
  validate({ bodySchema: schemas.createReview }),
  async (req, res, next) => {
    const { config, aiReviewer } = getDeps(req);
    return requireAuth(config)(req, res, (err) => {
      if (err) return next(err);
      const controller = new ReviewsController({ aiReviewer });
      return controller.create(req, res, next);
    });
  }
);

router.get(
  '/reviews',
  validate({ querySchema: schemas.getReviewsQuery }),
  async (req, res, next) => {
    const { config, aiReviewer } = getDeps(req);
    return requireAuth(config)(req, res, (err) => {
      if (err) return next(err);
      const controller = new ReviewsController({ aiReviewer });
      return controller.list(req, res, next);
    });
  }
);

router.get(
  '/review/:id',
  validate({ paramsSchema: schemas.reviewIdParam }),
  async (req, res, next) => {
    const { config, aiReviewer } = getDeps(req);
    return requireAuth(config)(req, res, (err) => {
      if (err) return next(err);
      const controller = new ReviewsController({ aiReviewer });
      return controller.getById(req, res, next);
    });
  }
);

module.exports = router;
