import * as adminVoucherModel from '../../models/admin/adminVoucherModel.js';

const fetchVouchers = async () => {
    return await adminVoucherModel.getAllVouchers();
};

const addVoucher = async (payload) => {
    const { ma_code, loai_giam_gia, gia_tri, ngay_bat_dau, ngay_ket_thuc } = payload;

    if (!ma_code || !loai_giam_gia || !gia_tri || !ngay_bat_dau || !ngay_ket_thuc) {
        const error = new Error('Please fill in all required voucher information!');
        error.statusCode = 400;
        throw error;
    }

    if (new Date(ngay_bat_dau) >= new Date(ngay_ket_thuc)) {
        const error = new Error('End date must be later than start date!');
        error.statusCode = 400;
        throw error;
    }

    return await adminVoucherModel.createVoucher(payload);
};

const removeVoucher = async (id) => {
    const isDeleted = await adminVoucherModel.deleteVoucher(id);
    if (!isDeleted) {
        const error = new Error('Voucher not found!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

export { fetchVouchers, addVoucher, removeVoucher };