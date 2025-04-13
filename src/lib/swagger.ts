import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Status Page API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Status Page application',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'API Support',
        email: 'support@statuspage.example.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Organizations',
        description: 'Organization management endpoints',
      },
      {
        name: 'Teams',
        description: 'Team management endpoints',
      },
      {
        name: 'Services',
        description: 'Service management endpoints',
      },
      {
        name: 'Incidents',
        description: 'Incident management endpoints',
      },
      {
        name: 'Maintenances',
        description: 'Scheduled maintenance endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment and update endpoints',
      },
      {
        name: 'Public',
        description: 'Public-facing endpoints',
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'], // Path to API routes with JSDoc annotations
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi }; 