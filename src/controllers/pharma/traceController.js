import * as traceService from '../../services/pharma/traceService.js';

const scanQR = async (req, res, next) => {
    try {
        const { uid, toa_do_lat, toa_do_lng } = req.body;
        
        // --- LOGIC LẤY IP CHUẨN PRODUCTION ---
        let ip_address = req.ip; 
        
        // Bóc tách IP thật nếu server bị kẹp sau Nginx/Cloudflare
        const forwardedIpsStr = req.headers['x-forwarded-for'];
        if (forwardedIpsStr) {
            // Lấy IP đầu tiên trong chuỗi (IP gốc của thiết bị khách)
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

        const data = await traceService.processQRScan(uid, toa_do_lat, toa_do_lng, ip_address);

        res.status(200).json({
            success: true,
            message: data.is_authentic ? 'Authentication successful!' : 'ALERT: Suspicious QR code detected!',
            data: data
        });

    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { scanQR };