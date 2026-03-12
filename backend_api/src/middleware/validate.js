'use strict';

// PUBLIC_INTERFACE
function validate({ bodySchema, querySchema, paramsSchema }) {
  /**
   * Express middleware factory for validating request parts with Joi.
   *
   * Contract:
   * - Inputs: Joi schemas for body/query/params (optional)
   * - Side effects: normalizes req.body/req.query/req.params to validated values
   * - Errors: responds 400 with validation details
   */
  return (req, res, next) => {
    try {
      if (bodySchema) {
        const { value, error } = bodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid request body',
            details: error.details.map((d) => d.message),
          });
        }
        req.body = value;
      }

      if (querySchema) {
        const { value, error } = querySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid query parameters',
            details: error.details.map((d) => d.message),
          });
        }
        req.query = value;
      }

      if (paramsSchema) {
        const { value, error } = paramsSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
        if (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid path parameters',
            details: error.details.map((d) => d.message),
          });
        }
        req.params = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  validate,
};
