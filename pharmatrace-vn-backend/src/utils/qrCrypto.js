import crypto from 'crypto';

const SECRET_KEY = process.env.QR_SECRET_KEY || 'pharmatrace-vn-fallback-secret-qr-key-2026';

/**
 * Generate a secure HMAC-SHA256 signature for a medication box UID.
 * @param {string} uid The unique identifier (UUID) of the box
 * @returns {string} The hex-encoded signature
 */
export function generateSignature(uid) {
    if (!uid) return '';
    return crypto
        .createHmac('sha256', SECRET_KEY)
        .update(uid)
        .digest('hex');
}

/**
 * Verify if the provided signature matches the HMAC signature of the UID.
 * Performs a timing-safe comparison to prevent side-channel timing attacks.
 * @param {string} uid The unique identifier (UUID) of the box
 * @param {string} signature The signature to verify
 * @returns {boolean} True if signature is valid, false otherwise
 */
export function verifySignature(uid, signature) {
    if (!uid || !signature) return false;
    try {
        const expectedSignature = generateSignature(uid);
        
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const clientBuffer = Buffer.from(signature, 'hex');
        
        if (expectedBuffer.length !== clientBuffer.length) {
            return false;
        }
        
        return crypto.timingSafeEqual(expectedBuffer, clientBuffer);
    } catch (e) {
        return false;
    }
}
