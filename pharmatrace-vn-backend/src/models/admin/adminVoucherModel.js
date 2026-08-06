import pool from '../../config/db.js';

export const getAllVouchers = async () => {
    const query = `SELECT * FROM KhuyenMai ORDER BY id DESC;`;
    const result = await pool.query(query);
    return result.rows;
};

export const createVoucher = async (data) => {
    const { ma_code, loai_giam_gia, gia_tri, don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_gioi_han } = data;
    const query = `
        INSERT INTO KhuyenMai (ma_code, loai_giam_gia, gia_tri, don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_gioi_han)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const result = await pool.query(query, [ma_code, loai_giam_gia, gia_tri, don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_gioi_han]);
    return result.rows[0];
};

export const deleteVoucher = async (id) => {
    // This table has no soft delete, so perform a hard delete
    const query = `DELETE FROM KhuyenMai WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
};