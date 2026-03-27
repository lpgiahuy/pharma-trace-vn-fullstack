import * as adminPrescriptionModel from '../../models/admin/adminPrescriptionModel.js';

export const fetchPrescriptions = async (status) => {
    return await adminPrescriptionModel.getPrescriptions(status);
};

export const changePrescriptionStatus = async (id, status) => {
    // Chỉ cho phép 3 trạng thái này (Theo đúng ràng buộc CHECK dưới Database)
    const validStatuses = ['ChoDuyet', 'HopLe', 'TuChoi'];
    
    if (!validStatuses.includes(status)) {
        const error = new Error('Trạng thái không hợp lệ! Chỉ nhận: ChoDuyet, HopLe, TuChoi.');
        error.statusCode = 400;
        throw error;
    }

    const updated = await adminPrescriptionModel.updatePrescriptionStatus(id, status);
    
    if (!updated) {
        const error = new Error('Không tìm thấy toa thuốc này trong hệ thống!');
        error.statusCode = 404;
        throw error;
    }
    
    return updated;
};