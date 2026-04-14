import * as traceModel from '../../models/pharma/traceModel.js';

const processQRScan = async (uid, lat, lng, ip) => {
    // 1. Kiểm tra UID tồn tại
    let boxInfo = await traceModel.getBoxInfo(uid);
    if (!boxInfo) {
        const error = new Error('Invalid QR code or not recognized by Pharma-Chain system');
        error.statusCode = 404;
        throw error;
    }

    // 2. Ghi nhật ký quét (Trigger trong DB sẽ tự xử lý logic vị trí)
    await traceModel.insertScanLog(uid, lat, lng, ip);

    // 3. Lấy lại thông tin mới nhất (để xem trạng thái có bị đổi thành CanhBaoGia không)
    boxInfo = await traceModel.getBoxInfo(uid);

    // 4. Lấy lịch sử phân phối
    const history = await traceModel.getDistributionHistory(uid);

    // 5. [MỚI] Lấy điểm rủi ro từ Function SQL
    const riskScore = await traceModel.getQRRiskScore(uid);

    return {
        box_info: boxInfo,
        trace_history: history,
        risk_score: riskScore, // Trả về điểm rủi ro (VD: 0, 15, 30, 100)
        is_authentic: boxInfo.trang_thai !== 'CanhBaoGia' && riskScore < 80 
        // Nếu risk_score quá cao (trên 80), chúng ta coi như không an toàn
    };
};

export { processQRScan };