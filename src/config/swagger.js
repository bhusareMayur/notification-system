// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scalable Notification System API',
      version: '1.0.0',
      description: 'API documentation for the Asynchronous Multi-Channel Notification System',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Local development server',
      },
    ],
    paths: {
      '/api/notifications': {
        post: {
          summary: 'Create a new notification',
          description: 'Validates and enqueues a new notification for asynchronous processing via RabbitMQ.',
          tags: ['Notifications'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationRequest' },
                example: {
                  channel: 'EMAIL',
                  email: 'user@example.com',
                  name: 'Test User',
                  template: 'WELCOME',
                  idempotencyKey: 'unique-email-test-08'
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Notification validated, persisted to DB, and published to queue.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NotificationAccepted' }
                }
              }
            },
            '200': {
              description: 'Notification dropped because it was already processed.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ALREADY_PROCESSED' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/notifications/retry/{id}': {
        post: {
          summary: 'Retry a failed notification',
          description: 'Manually triggers a retry for a specific notification from the DLQ.',
          tags: ['Notifications'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'The MySQL ID of the notification to retry'
            }
          ],
          responses: {
            '202': {
              description: 'Retry request accepted and re-queued.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ACCEPTED' },
                      notificationId: { type: 'integer', example: 10 }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        NotificationRequest: {
          type: 'object',
          required: ['channel'],
          properties: {
            channel: {
              type: 'string',
              enum: ['EMAIL', 'SMS', 'PUSH'],
              description: 'The target notification channel'
            },
            email: { type: 'string', description: 'Required if channel is EMAIL' },
            phoneNumber: { type: 'string', description: 'Required if channel is SMS (+E.164)' },
            deviceToken: { type: 'string', description: 'Required if channel is PUSH' },
            name: { type: 'string', description: 'Name of the recipient' },
            template: { type: 'string', description: 'Template identifier or raw body' },
            idempotencyKey: { type: 'string', description: 'Unique key to prevent duplicate processing' }
          }
        },
        NotificationAccepted: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ACCEPTED' },
            notificationId: { type: 'integer', example: 42 },
            channel: { type: 'string', example: 'EMAIL' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Channel is required' }
          }
        }
      }
    }
  },
  apis: [], // No longer parsing route files for comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;