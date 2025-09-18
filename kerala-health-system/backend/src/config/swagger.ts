import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kerala Digital Health Record Management System API',
      version: '1.0.0',
      description: `
        A comprehensive, multilingual, offline-capable Digital Health Record Management System 
        for migrant workers in Kerala, India.
        
        ## Features
        - FHIR-compliant resources
        - Multilingual support (English, Hindi, Malayalam)
        - Offline synchronization
        - QR code generation for health cards
        - ABHA integration
        - Audit logging and consent management
        - Analytics and outbreak detection
        
        ## Authentication
        This API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <token>\`
        
        ## Government Integration
        - Ayushman Bharat Health Account (ABHA) integration
        - Integrated Disease Surveillance Programme (IDSP) compatibility
        - Kerala State Health Department workflows
      `,
      contact: {
        name: 'Kerala Health Department',
        url: 'https://kerala.gov.in/health',
        email: 'health@kerala.gov.in'
      },
      license: {
        name: 'Government of Kerala',
        url: 'https://kerala.gov.in'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.kerala-health.gov.in/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clp123abc456' },
            abhaId: { type: 'string', example: '12-3456-7890-1234' },
            stateId: { type: 'string', example: 'KL123456789' },
            firstName: { type: 'string', example: 'രാജു' },
            lastName: { type: 'string', example: 'കുമാർ' },
            gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] },
            birthDate: { type: 'string', format: 'date', example: '1985-06-15' },
            phone: { type: 'string', example: '+91-9876543210' },
            district: { type: 'string', example: 'Ernakulam' },
            taluk: { type: 'string', example: 'Kochi' },
            originState: { type: 'string', example: 'Odisha' },
            workSite: { type: 'string', example: 'Construction Site - Metro Phase 2' },
            preferredLanguage: { type: 'string', enum: ['en', 'hi', 'ml'], example: 'ml' },
            qrCode: { type: 'string', example: 'KH-QR-123456789' }
          }
        },
        Encounter: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cle123abc456' },
            status: { type: 'string', enum: ['PLANNED', 'ARRIVED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'] },
            class: { type: 'string', enum: ['INPATIENT', 'OUTPATIENT', 'EMERGENCY', 'HOME_HEALTH', 'VIRTUAL'] },
            chiefComplaint: { type: 'string', example: 'Fever and cough for 3 days' },
            diagnosis: { type: 'string', example: 'Upper respiratory tract infection' },
            treatment: { type: 'string', example: 'Paracetamol 500mg TID, Rest' },
            facility: { type: 'string', example: 'Primary Health Centre, Kochi' },
            startTime: { type: 'string', format: 'date-time' }
          }
        },
        Observation: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clo123abc456' },
            status: { type: 'string', enum: ['REGISTERED', 'PRELIMINARY', 'FINAL', 'AMENDED'] },
            code: { type: 'string', example: '8310-5' },
            display: { type: 'string', example: 'Body temperature' },
            valueNumber: { type: 'number', example: 38.5 },
            unit: { type: 'string', example: 'Cel' },
            effectiveDateTime: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation Error' },
            message: { type: 'string', example: 'Required field missing' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/api/v1/patients' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJSDoc(options);