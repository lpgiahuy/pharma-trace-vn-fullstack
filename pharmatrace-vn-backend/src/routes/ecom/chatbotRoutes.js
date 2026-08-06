import express from 'express';
import { chat } from '../../controllers/ecom/chatbotCtrl.js';
import rateLimit from 'express-rate-limit';

// Stricter rate limit for chatbot: 30 messages per 15 minutes per IP
const chatbotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 15 phút.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post('/message', chatbotLimiter, chat);

export default router;
