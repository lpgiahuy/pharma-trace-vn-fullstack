import {
    getSuppliersModel,
    createSupplierModel,
    getPurchaseOrdersModel,
    getPurchaseOrderByIdModel,
    createPurchaseOrderModel,
    updatePurchaseOrderStatusModel
} from '../../models/admin/procurementModel.js';

export const getSuppliersService = async () => {
    return await getSuppliersModel();
};

export const createSupplierService = async (data) => {
    if (!data.ten_don_vi) {
        throw new Error('Tên nhà cung cấp không được để trống');
    }
    return await createSupplierModel(data);
};

export const getPurchaseOrdersService = async (userContext = null, type = 'all') => {
    return await getPurchaseOrdersModel(userContext, type);
};

export const getPurchaseOrderByIdService = async (id) => {
    const po = await getPurchaseOrderByIdModel(id);
    if (!po) {
        throw new Error('Không tìm thấy phiếu nhập hàng');
    }
    return po;
};

export const createPurchaseOrderService = async (poData) => {
    if (!poData.nha_cung_cap_id) {
        throw new Error('Vui lòng chọn Nhà cung cấp');
    }
    if (!poData.items || !Array.isArray(poData.items) || poData.items.length === 0) {
        throw new Error('Danh sách mặt hàng nhập không được để trống');
    }
    return await createPurchaseOrderModel(poData);
};

export const updatePurchaseOrderStatusService = async (id, trang_thai) => {
    const validStatuses = ['ChoDuyet', 'DaDuyet', 'DaNhapKho', 'DaHuy'];
    if (!validStatuses.includes(trang_thai)) {
        throw new Error('Trạng thái không hợp lệ');
    }
    const updated = await updatePurchaseOrderStatusModel(id, trang_thai);
    if (!updated) {
        throw new Error('Không tìm thấy phiếu nhập hàng để cập nhật');
    }
    return updated;
};
