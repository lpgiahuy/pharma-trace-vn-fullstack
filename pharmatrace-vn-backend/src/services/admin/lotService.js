import {
    getLotsModel,
    getLotStatsModel,
    createLotModel,
    recallLotModel
} from '../../models/admin/lotModel.js';

export const getLotsService = async (filters) => {
    return await getLotsModel(filters);
};

export const getLotStatsService = async () => {
    return await getLotStatsModel();
};

export const createLotService = async (data) => {
    if (!data.duoc_pham_id || !data.so_lo || !data.ngay_san_xuat || !data.han_su_dung) {
        throw new Error('Vui lòng nhập đầy đủ thông tin: ID Dược phẩm, Số lô, Ngày sản xuất và Hạn sử dụng');
    }
    if (new Date(data.han_su_dung) <= new Date(data.ngay_san_xuat)) {
        throw new Error('Hạn sử dụng phải lớn hơn Ngày sản xuất');
    }
    return await createLotModel(data);
};

export const recallLotService = async (id) => {
    const result = await recallLotModel(id);
    if (!result) {
        throw new Error('Không tìm thấy Lô sản phẩm để kích hoạt thu hồi');
    }
    return result;
};
