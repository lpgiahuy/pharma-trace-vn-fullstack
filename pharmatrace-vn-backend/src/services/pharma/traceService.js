import * as traceModel from '../../models/pharma/traceModel.js';

const processQRScan = async (uid, lat, lng, ip) => {
    // 1. Check if UID exists
    let boxInfo = await traceModel.getBoxInfo(uid);
    if (!boxInfo) {
        const error = new Error('Invalid QR code or not recognized by Pharma-Chain system');
        error.statusCode = 404;
        throw error;
    }

    // 2. Log the scan event
    await traceModel.insertScanLog(uid, lat, lng, ip);

    // 3. Re-fetch latest box info (to check CanhBaoGia status after logging)
    boxInfo = await traceModel.getBoxInfo(uid);

    // 4. Fetch distribution history + risk score + scan details in parallel
    const [history, riskScore, scanDetails] = await Promise.all([
        traceModel.getDistributionHistory(uid),
        traceModel.getQRRiskScore(uid),
        traceModel.getScanDetails(uid),
    ]);

    return {
        box_info:     boxInfo,
        trace_history: history,
        risk_score:   riskScore,
        is_authentic: boxInfo.trang_thai !== 'CanhBaoGia' && riskScore < 80,
        // Breakdown of the two SQL fraud checks for the UI to display
        scan_details: scanDetails, // { total, firstScan, lastScan, maxPerMinute, hasLocationAnomaly }
    };
};

export { processQRScan };