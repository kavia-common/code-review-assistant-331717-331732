const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Code Review Assistant API',
      version: '1.0.0',
      description:
        'Backend API for authentication and AI-powered code review. Authentication is optional for review endpoints; if you do login, you may pass `Authorization: Bearer <token>` to scope history to your user.',
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
