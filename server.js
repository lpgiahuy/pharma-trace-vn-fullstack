import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; // [MỚI] Che Tech Stack
import rateLimit from 'express-rate-limit'; // [MỚI] Chống Spam
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

// Điều này giúp req.ip lấy đúng IP thật, và express-rate-limit không bị chặn nhầm người.
app.set('trust proxy', 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- 1. LỚP BẢO VỆ CƠ BẢN (MIDDLEWARE BẢO MẬT) ---

// Che giấu Express và thêm các Header bảo mật
app.use(helmet());
// Cho phép hiển thị ảnh tĩnh từ domain khác (nếu Front-end khác domain)
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Cấu hình CORS chặt chẽ: Chỉ cho phép tên miền Frontend của bạn truy cập
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

// Giới hạn dung lượng Body JSON gửi lên (Nâng lên 50mb để hỗ trợ đăng bài Blog có kèm ảnh Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. LỚP CHỐNG SPAM (RATE LIMITING) ---
// Giới hạn tối đa 100 request / 15 phút cho mỗi IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Áp dụng giới hạn này cho toàn bộ API
app.use('/v1/pharmatrace', apiLimiter, rootRoutes);


// --- 3. TÀI NGUYÊN TĨNH VÀ TÀI LIỆU ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình Basic Auth an toàn: Không dùng mật khẩu mặc định
const swaggerUser = process.env.SWAGGER_USER;
const swaggerPass = process.env.SWAGGER_PASS;

if (swaggerUser && swaggerPass) {
    const swaggerAuth = basicAuth({
        users: { [swaggerUser]: swaggerPass },
        challenge: true,
        unauthorizedResponse: 'Truy cập bị từ chối!'
    });
    app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(specs));
} else {
    console.warn("⚠️ Cảnh báo: SWAGGER_USER hoặc SWAGGER_PASS chưa được thiết lập. API Docs đã bị vô hiệu hóa để bảo đảm an toàn.");
}


// --- 4. XỬ LÝ LỖI (ERROR HANDLING) ---

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại!' });
});

// [MỚI] 500 Global Error Handler: Bắt mọi lỗi sập server để không lộ Stack Trace
app.use((err, req, res, next) => {
    // Ưu tiên: status đã set bởi res.status() > err.statusCode > mặc định 500
    const statusCode = (res.statusCode && res.statusCode !== 200)
        ? res.statusCode
        : (err.statusCode || 500);

    console.error(`[Lỗi ${statusCode}]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Đã có lỗi máy chủ nội bộ xảy ra!' : err.message
    });
});

// --- 5. KHỞI ĐỘNG SERVER ---
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