import {
    getFraudAlertsService,
    getFraudStatsService,
    updateAlertStatusService,
    simulateScanEngineService
} from '../../services/admin/fraudAnomalyService.js';

export const getFraudAlerts = async (req, res) => {
    try {
        const { riskLevel, alertType, status, search } = req.query;
        const alerts = await getFraudAlertsService({ riskLevel, alertType, status, search });
        res.status(200).json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFraudStats = async (req, res) => {
    try {
        const stats = await getFraudStatsService();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAlertStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const alert = await updateAlertStatusService(req.params.id, status);
        res.status(200).json({ success: true, message: 'Cập nhật trạng thái xử lý cảnh báo thành công', data: alert });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const simulateScanEngine = async (req, res) => {
    try {
        const result = await simulateScanEngineService(req.body);
        res.status(200).json({
            success: true,
            message: result.anomalyDetected 
                ? 'PHÁT HIỆN CẢNH BÁO GIAN LẬN VẬN TỐC / TỌA ĐỘ BẤT THƯỜNG' 
                : 'Kết quả xác thực hợp lệ (Tọa độ và vận tốc bình thường).',
            data: result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
