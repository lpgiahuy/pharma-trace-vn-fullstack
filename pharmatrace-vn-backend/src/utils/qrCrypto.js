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

/**
 * Generate a 6-character alphanumeric PIN for a medication box UID (e.g. 9K3N8A)
 * Deterministically derived via HMAC-SHA256
 * @param {string} uid 
 * @returns {string} 6-character PIN
 */
export function generateBoxPin(uid) {
    if (!uid) return '';
    const hmac = crypto.createHmac('sha256', SECRET_KEY).update(`pin-${uid}`).digest('hex');
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let pin = '';
    for (let i = 0; i < 6; i++) {
        const byte = parseInt(hmac.substring(i * 2, i * 2 + 2), 16);
        pin += alphabet[byte % alphabet.length];
    }
    return pin;
}

/**
 * Compute SHA-256 hash of a normalized PIN
 * @param {string} pin 
 * @returns {string} hex hash
 */
export function hashPin(pin) {
    if (!pin) return '';
    const clean = pin.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Verify if provided PIN matches stored hash or expected derived PIN
 * @param {string} uid 
 * @param {string} pin 
 * @param {string|null} storedHash 
 * @returns {boolean}
 */
export function verifyBoxPin(uid, pin, storedHash = null) {
    if (!uid || !pin) return false;
    const cleanPin = pin.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const clientHash = hashPin(cleanPin);
    
    if (storedHash) {
        return storedHash === clientHash;
    }
    const expectedPin = generateBoxPin(uid);
    return cleanPin === expectedPin;
}
