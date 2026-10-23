const swaggerJSDoc = require('swagger-jsdoc');
module.exports = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Hospital Management System API', version: '1.0.0', description: 'Enterprise hospital management API — Admin / Doctor / Nurse / Receptionist / Patient modules' },
    servers: [{ url: 'http://localhost:5000' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
});
