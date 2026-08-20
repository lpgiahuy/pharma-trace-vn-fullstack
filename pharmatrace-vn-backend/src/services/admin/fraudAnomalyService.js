import {
    getFraudAlertsModel,
    getFraudStatsModel,
    updateAlertStatusModel,
    simulateScanEngineModel
} from '../../models/admin/fraudAnomalyModel.js';

export const getFraudAlertsService = async (filters) => {
    return await getFraudAlertsModel(filters);
};

export const getFraudStatsService = async () => {
    return await getFraudStatsModel();
};

export const updateAlertStatusService = async (id, status) => {
    const validStatuses = ['Moi', 'DangXuLy', 'DaKiemChung', 'BaoDongGia'];
    if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái cảnh báo gian lận không hợp lệ');
    }
    const updated = await updateAlertStatusModel(id, status);
    if (!updated) {
        throw new Error('Không tìm thấy Cảnh báo để cập nhật');
    }
    return updated;
};

export const simulateScanEngineService = async (data) => {
    if (!data.hop_thuoc_uid) {
        throw new Error('Vui lòng cung cấp UID Hộp thuốc');
    }
    if (data.lat === undefined || data.lng === undefined) {
        throw new Error('Vui lòng cung cấp Tọa độ Vĩ độ (Lat) và Kinh độ (Lng)');
    }
    return await simulateScanEngineModel(data);
};
