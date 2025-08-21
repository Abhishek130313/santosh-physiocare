const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Physiotherapy API - Dr. Santosh Bilwal',
    version: '1.0.0',
    description: 'REST API for appointments, reviews, services, contacts, and admin operations.'
  },
  servers: [
    { url: 'http://localhost:' + (process.env.PORT || 4000), description: 'Local dev' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [ { bearerAuth: [] } ]
};

const options = {
  swaggerDefinition,
  apis: ['src/routes/*.js', 'src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };

