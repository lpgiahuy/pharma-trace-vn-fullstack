import * as traceService from '../../services/pharma/traceService.js';

const scanQR = async (req, res, next) => {
    try {
        const { uid, toa_do_lat, toa_do_lng } = req.body;
        
        // take IP address from request (for logging and fraud detection)
        const ip_address = req.ip || req.connection.remoteAddress;

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