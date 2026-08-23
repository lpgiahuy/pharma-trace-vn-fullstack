import {
    getShipmentsModel,
    getCodSummaryModel,
    createShipmentModel,
    updateShipmentStatusModel,
    reconcileCodModel,
    deleteShipmentModel,
    getOrderInfoForShipmentModel
} from '../../models/admin/logisticsCodModel.js';

export const getShipmentsService = async (filters) => {
    return await getShipmentsModel(filters);
};

export const getCodSummaryService = async () => {
    return await getCodSummaryModel();
};

export const createShipmentService = async (data) => {
    if (!data.don_hang_id) {
        throw new Error('Vui lòng cung cấp ID Đơn hàng');
    }
    return await createShipmentModel(data);
};

export const updateShipmentStatusService = async (id, trang_thai_giao) => {
    const validStatuses = ['ChoLayHang', 'DangVanChuyen', 'GiaoThanhCong', 'GiaoThatBai', 'TraHang'];
    if (!validStatuses.includes(trang_thai_giao)) {
        throw new Error('Trạng thái giao hàng không hợp lệ');
    }
    const updated = await updateShipmentStatusModel(id, trang_thai_giao);
    if (!updated) {
        throw new Error('Không tìm thấy Vận đơn để cập nhật');
    }
    return updated;
};

export const reconcileCodService = async (id) => {
    const reconciled = await reconcileCodModel(id);
    if (!reconciled) {
        throw new Error('Không tìm thấy Vận đơn để đối soát COD');
    }
    return reconciled;
};

export const deleteShipmentService = async (id) => {
    const deleted = await deleteShipmentModel(id);
    if (!deleted) {
        throw new Error('Không tìm thấy Vận đơn để xóa');
    }
    return deleted;
};

export const getOrderInfoForShipmentService = async (orderId) => {
    const order = await getOrderInfoForShipmentModel(orderId);
    if (!order) {
        throw new Error(`Không tìm thấy đơn hàng #${orderId}`);
    }
    return order;
};
