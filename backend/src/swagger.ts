import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Kerala DHRMS API',
      version: '0.1.0',
      description: 'FHIR-style REST API for Digital Health Record prototype.'
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local' }
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
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/**/*.ts'],
};

export const specs = swaggerJSDoc(options);