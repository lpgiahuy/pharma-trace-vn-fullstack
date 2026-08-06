import pool from '../../config/db.js';

export const validateVoucher = async (ma_code, tong_tien_don_hang) => {
    if (!ma_code) {
        const error = new Error('Vui lòng nhập mã khuyến mãi!');
        error.statusCode = 400;
        throw error;
    }

    // find voucher by code
    const query = `SELECT * FROM KhuyenMai WHERE ma_code = $1`;
    const result = await pool.query(query, [ma_code]);

    if (result.rowCount === 0) {
        const error = new Error('Mã khuyến mãi không tồn tại!');
        error.statusCode = 404;
        throw error;
    }

    const voucher = result.rows[0];
    const now = new Date();

    // check voucher validity
    if (now < new Date(voucher.ngay_bat_dau)) {
        const err = new Error('Mã khuyến mãi chưa đến thời gian sử dụng!');
        err.statusCode = 400; throw err;
    }
    if (now > new Date(voucher.ngay_ket_thuc)) {
        const err = new Error('Mã khuyến mãi đã hết hạn!');
        err.statusCode = 400; throw err;
    }
    if (voucher.so_luong_gioi_han !== null && voucher.so_luong_da_dung >= voucher.so_luong_gioi_han) {
        const err = new Error('Mã khuyến mãi đã hết lượt sử dụng!');
        err.statusCode = 400; throw err;
    }
    if (tong_tien_don_hang < voucher.don_hang_toi_thieu) {
        const err = new Error(`Đơn hàng của bạn phải đạt tối thiểu ${voucher.don_hang_toi_thieu}đ để áp dụng mã này!`);
        err.statusCode = 400; throw err;
    }

    // calculate discount amount
    let so_tien_giam = 0;
    if (voucher.loai_giam_gia === 'PhanTram') {
        so_tien_giam = (tong_tien_don_hang * voucher.gia_tri) / 100;
    } else {
        so_tien_giam = Number(voucher.gia_tri);
    }

    return {
        ma_code: voucher.ma_code,
        loai_giam_gia: voucher.loai_giam_gia,
        so_tien_giam: so_tien_giam
    };
};