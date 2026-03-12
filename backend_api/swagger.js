const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Code Review Assistant API',
      version: '1.0.0',
      description:
        'Backend API for authentication and AI-powered code review. Use /auth/login to obtain a JWT, then pass it as `Authorization: Bearer <token>`.',
    },
    tags: [
      { name: 'Health', description: 'Service health endpoints' },
      { name: 'Auth', description: 'User signup/login' },
      { name: 'Reviews', description: 'Submit code for review and access review history' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.js', './src/controllers/**/*.js'], // include controllers with @swagger blocks
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
