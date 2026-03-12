'use strict';

const Joi = require('joi');

const emailSchema = Joi.string().email().max(320).required();
const passwordSchema = Joi.string().min(8).max(200).required();

// PUBLIC_INTERFACE
function getSchemas() {
  /** Returns Joi schemas used by the API boundary layer. */
  return {
    authSignup: Joi.object({
      email: emailSchema,
      password: passwordSchema,
    }).required(),

    authLogin: Joi.object({
      email: emailSchema,
      password: Joi.string().min(1).max(200).required(),
    }).required(),

    createReview: Joi.object({
      language: Joi.string().min(1).max(100).required(),
      code: Joi.string().min(1).max(200000).required(),
      title: Joi.string().max(200).allow(null, ''),
    }).required(),

    getReviewsQuery: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).max(100000).default(0),
    }).required(),

    reviewIdParam: Joi.object({
      id: Joi.number().integer().min(1).required(),
    }).required(),
  };
}

module.exports = {
  getSchemas,
};
