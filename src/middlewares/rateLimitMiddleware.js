import rateLimit from 'express-rate-limit';

/**
 * Limiter for authentication routes (Login/Register)
 * Stricter to prevent brute force and account creation spam
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many login or registration attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Limiter for checkout/order placement
 * Prevents automated order spamming and potential inventory locking attacks
 */
export const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 checkouts per 15 minutes
    message: {
        success: false,
        message: 'Too many checkout attempts. Please wait a moment before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
