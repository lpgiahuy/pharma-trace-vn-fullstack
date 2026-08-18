import * as traceService from '../../services/pharma/traceService.js';
import { verifySignature } from '../../utils/qrCrypto.js';

const scanQR = async (req, res, next) => {
    try {
        const { uid, sig, pin, toa_do_lat, toa_do_lng } = req.body;
        
        // --- PRODUCTION-SAFE IP EXTRACTION ---
        let ip_address = req.ip;

        // Extract the real client IP when the server is behind Nginx/Cloudflare
        const forwardedIpsStr = req.headers['x-forwarded-for'];
        if (forwardedIpsStr) {
            // Take the first IP in the chain (the original client device IP)
            const ipList = forwardedIpsStr.split(',');
            ip_address = ipList[0].trim();
        } else if (req.connection && req.connection.remoteAddress) {
            ip_address = req.connection.remoteAddress;
        }
        // -------------------------------------

        if (!uid) {
            res.status(400);
            throw new Error('Missing medication box UID');
        }

        // If a signature is provided, verify it
        if (sig && !verifySignature(uid, sig)) {
            res.status(400);
            throw new Error('Chữ ký mã QR không hợp lệ. Tính xác thực không thể được xác minh.');
        }

        const data = await traceService.processQRScan(uid, pin, toa_do_lat, toa_do_lng, ip_address);

        res.status(200).json({
            success: true,
            message: data.is_authentic ? 'Truy xuất thông tin thành công!' : 'CẢNH BÁO: Phát hiện bất thường đối với mã này!',
            data: data
        });

    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { scanQR };