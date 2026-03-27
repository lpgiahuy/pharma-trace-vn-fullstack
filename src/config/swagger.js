import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pharma-Chain API Documentation',
            version: '1.0.0',
            description: 'An Integrated System for Sales Management, Supply Chain Transparency, and Pharmaceutical Authentication',
            contact: {
                name: 'Developer Team',
            },
        },
        servers: [
            {
                url: 'http://localhost:3002/v1/pharmachain',
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
        },
    },
    // Path to the API docs
    apis: [
        path.join(__dirname, '../routes/**/*.js')
    ],
};

export const specs = swaggerJSDoc(options);