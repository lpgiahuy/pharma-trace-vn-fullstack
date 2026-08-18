import * as traceModel from '../../models/pharma/traceModel.js';
import { verifyBoxPin } from '../../utils/qrCrypto.js';

const processQRScan = async (uid, pin = null, lat = null, lng = null, ip = null) => {
    // 1. Check if UID exists
    let boxInfo = await traceModel.getBoxInfo(uid);
    if (!boxInfo) {
        const error = new Error('Mã QR không tồn tại hoặc không được nhận diện trong hệ thống PharmaTrace');
        error.statusCode = 404;
        throw error;
    }

    // 2. Log the scan event
    await traceModel.insertScanLog(uid, lat, lng, ip);

    // 3. Re-fetch latest box info (to check CanhBaoGia status after logging / anomaly checks)
    boxInfo = await traceModel.getBoxInfo(uid);

    // 4. Fetch distribution history + risk score + scan details in parallel
    const [history, riskScore, scanDetails] = await Promise.all([
        traceModel.getDistributionHistory(uid),
        traceModel.getQRRiskScore(uid),
        traceModel.getScanDetails(uid),
    ]);

    // 5. Dual-Code Authentication Status Evaluation
    let authStatus = 'PIN_REQUIRED';
    let authMessage = 'Mã vận hành hợp lệ. Để xác thực chính hãng 100%, vui lòng cào nhẹ lớp bạc trên tem chống giả và quét mã QR hoặc nhập mã PIN.';

    const cleanPin = (pin || '').trim();
    if (cleanPin) {
        const isPinValid = verifyBoxPin(uid, cleanPin, boxInfo.secret_pin_hash);
        if (!isPinValid) {
            authStatus = 'INVALID_PIN';
            authMessage = 'Mã PIN bảo mật không chính xác. Vui lòng kiểm tra lại lớp cào hoặc liên hệ dược sĩ nếu nghi ngờ tem bị làm giả.';
        } else {
            const currentPinScans = Number(boxInfo.so_lan_quet_pin || 0);
            if (currentPinScans === 0) {
                // First time authentic activation!
                await traceModel.recordPinScan(uid, true);
                authStatus = 'FIRST_SCAN_AUTHENTIC';
                authMessage = 'Xác thực chính hãng thành công lần đầu tiên! Sản phẩm đã được kích hoạt an toàn.';
                boxInfo.so_lan_quet_pin = 1;
                boxInfo.ngay_kich_hoat = new Date();
                boxInfo.trang_thai_kich_hoat = 'DaKichHoat';
            } else {
                // Legitimate repeat scan by buyer
                await traceModel.recordPinScan(uid, false);
                authStatus = 'REPEATED_SCAN_AUTHENTIC';
                authMessage = 'Sản phẩm chính hãng (Đã kích hoạt trước đó). Nếu bạn là người mua sản phẩm này, bạn có thể hoàn toàn yên tâm sử dụng.';
                boxInfo.so_lan_quet_pin = currentPinScans + 1;
            }
        }
    } else if (Number(boxInfo.so_lan_quet_pin || 0) > 0 || boxInfo.trang_thai_kich_hoat === 'DaKichHoat') {
        authStatus = 'ACTIVATED_NEED_PIN';
        authMessage = 'Mã vận hành ngoài vỏ hợp lệ. Mã bảo mật của hộp thuốc này đã được kích hoạt trước đó.';
    }

    const isAuthentic = boxInfo.trang_thai !== 'CanhBaoGia' && riskScore < 80 && authStatus !== 'INVALID_PIN';

    // Sanitize boxInfo before sending to client (remove secret_pin_hash)
    const sanitizedBoxInfo = { ...boxInfo };
    delete sanitizedBoxInfo.secret_pin_hash;

    return {
        box_info: sanitizedBoxInfo,
        trace_history: history,
        risk_score: riskScore,
        is_authentic: isAuthentic,
        scan_details: scanDetails,
        auth_status: authStatus, // 'PIN_REQUIRED' | 'FIRST_SCAN_AUTHENTIC' | 'REPEATED_SCAN_AUTHENTIC' | 'INVALID_PIN'
        auth_message: authMessage,
        pin_provided: !!cleanPin
    };
};

export { processQRScan };