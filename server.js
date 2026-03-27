import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { connectToDatabase } from './src/config/db.js';
import rootRoutes from './src/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCronJobs } from './src/utils/cronJobs.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './src/config/swagger.js';
import basicAuth from 'express-basic-auth';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// basic middleware
app.use(cors());
app.use(express.json());

// static file serving for uploaded images (e.g. product images, prescription uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/v1/pharmachain', rootRoutes);

// config security for Swagger UI - using HTTP Basic Auth to protect the API documentation
const swaggerAuth = basicAuth({
    users: {
        // get username and password for Swagger UI from environment variables, with defaults for development
        [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASS || '123456'
    },
    challenge: true, // force the browser to show the login dialog
    unauthorizedResponse: 'Access denied: You must provide valid credentials to view the API documentation.'
});

// swaggerAuth for /api-docs route to protect the API documentation with basic auth
app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(specs));


// 404 handler - catch all for undefined routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại!' });
});

const PORT = process.env.PORT || 3002;
//0.0.0.0 for better compatibility when deploying to cloud platforms (like Render)
const HOST = process.env.HOST || '0.0.0.0';

// start the server after connecting to the database and starting cron jobs
(async () => {
    try {
        await connectToDatabase();
        startCronJobs();

        app.listen(PORT, HOST, () => {
            console.log(`Server Pharma-Chain running on http://localhost:${PORT}`);
            console.log(`API documentation available at: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error("Cannot start server:", error.message);
        process.exit(1);
    }
})();