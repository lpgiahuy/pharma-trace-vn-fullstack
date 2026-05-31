import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // Hides server tech stack info
import rateLimit from 'express-rate-limit'; // Prevents spam / brute-force
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

// Ensures req.ip returns the real client IP so express-rate-limit works correctly behind a proxy.
app.set('trust proxy', 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- 1. BASIC SECURITY LAYER (SECURITY MIDDLEWARE) ---

// Hide Express signature and add security headers
app.use(helmet());
// Allow static images to be loaded cross-origin (e.g. when frontend is on a different domain)
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Strict CORS: only allow requests from the configured frontend origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_2 // Optional backup
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || process.env.NODE_ENV !== 'production') return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};
app.use(cors(corsOptions));

// Raise body size limit to 50mb to support blog posts with Base64-encoded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. ANTI-SPAM LAYER (RATE LIMITING) ---
// Limit to 1000 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiter to all API routes
app.use('/v1/pharmatrace', apiLimiter, rootRoutes);


// --- 3. STATIC ASSETS & API DOCS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Secure Basic Auth config: does not use hardcoded default credentials
const swaggerUser = process.env.SWAGGER_USER;
const swaggerPass = process.env.SWAGGER_PASS;

if (swaggerUser && swaggerPass) {
    const swaggerAuth = basicAuth({
        users: { [swaggerUser]: swaggerPass },
        challenge: true,
        unauthorizedResponse: 'Access denied!'
    });
    app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(specs));
} else {
    console.warn("⚠️ Warning: SWAGGER_USER or SWAGGER_PASS is not set. API Docs have been disabled for security.");
}


// --- 4. ERROR HANDLING ---

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found!' });
});

// 500 Global Error Handler: catches all unhandled errors without leaking stack traces
app.use((err, req, res, next) => {
    // Priority: status set by res.status() > err.statusCode > default 500
    const statusCode = (res.statusCode && res.statusCode !== 200)
        ? res.statusCode
        : (err.statusCode || 500);

    console.error(`[Error ${statusCode}]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred!' : err.message
    });
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 3002;
const HOST = process.env.DB_HOST || '0.0.0.0';

(async () => {
    try {
        await connectToDatabase();
        startCronJobs();

        app.listen(PORT, HOST, () => {
            console.log(`🚀 Server Pharma-Chain running on http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Cannot start server:", error.message);
        process.exit(1);
    }
})();