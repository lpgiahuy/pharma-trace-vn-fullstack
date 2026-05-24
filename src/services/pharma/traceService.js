import * as traceModel from '../../models/pharma/traceModel.js';

const processQRScan = async (uid, lat, lng, ip) => {
    // 1. Kiểm tra UID tồn tại
    let boxInfo = await traceModel.getBoxInfo(uid);
    if (!boxInfo) {
        const error = new Error('Invalid QR code or not recognized by Pharma-Chain system');
        error.statusCode = 404;
        throw error;
    }

    // 2. Ghi nhật ký quét
    await traceModel.insertScanLog(uid, lat, lng, ip);

    // 3. Lấy lại thông tin mới nhất (kiểm tra trạng thái CanhBaoGia sau khi log)
    boxInfo = await traceModel.getBoxInfo(uid);

    // 4. Lấy lịch sử phân phối + điểm rủi ro + chi tiết scan song song
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