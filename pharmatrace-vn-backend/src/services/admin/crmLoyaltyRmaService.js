import {
    getCustomersCrmModel,
    getCrmStatsModel,
    getCustomerPointsHistoryModel,
    adjustCustomerPointsModel,
    getRmaRequestsModel,
    updateRmaStatusModel,
    getRmaDetailModel
} from '../../models/admin/crmLoyaltyRmaModel.js';

export const getCustomersCrmService = async (filters) => {
    return await getCustomersCrmModel(filters);
};

export const getCrmStatsService = async () => {
    return await getCrmStatsModel();
};

export const getCustomerPointsHistoryService = async (customerId) => {
    return await getCustomerPointsHistoryModel(customerId);
};

export const adjustCustomerPointsService = async (data) => {
    if (!data.customer_id) {
        throw new Error('Vui lòng cung cấp ID Khách hàng');
    }
    const pointsNum = Number(data.points);
    if (data.points === undefined || isNaN(pointsNum) || pointsNum === 0) {
        throw new Error('Vui lòng cung cấp số điểm hợp lệ khác 0');
    }
    // Enterprise Security Rule: Giới hạn hạn mức điều chỉnh tối đa ±5,000 điểm / lần để tránh gian lận
    if (Math.abs(pointsNum) > 5000) {
        throw new Error('Hạn mức điều chỉnh thủ công tối đa là ±5,000 điểm / lần. Nếu muốn thưởng lớn hơn, cần có sự phê duyệt của SuperAdmin!');
    }
    if (!data.description || data.description.trim().length < 5) {
        throw new Error('Vui lòng nhập lý do / ghi chú giải trình chi tiết (tối thiểu 5 ký tự) để phục vụ kiểm toán Audit!');
    }
    return await adjustCustomerPointsModel(data);
};

export const getRmaRequestsService = async (filters) => {
    return await getRmaRequestsModel(filters);
};

export const updateRmaStatusService = async (id, status) => {
    const validStatuses = ['ChoDuyet', 'DaDuyet', 'DaHoanTien', 'TuChoi'];
    if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái phê duyệt RMA không hợp lệ');
    }
    const updated = await updateRmaStatusModel(id, status);
    if (!updated) {
        throw new Error('Không tìm thấy yêu cầu RMA để cập nhật');
    }
    return updated;
};

export const getRmaDetailService = async (rmaId) => {
    const detail = await getRmaDetailModel(rmaId);
    if (!detail) {
        throw new Error('Không tìm thấy chi tiết phiếu RMA');
    }
    return detail;
};
