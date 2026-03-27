import pool from '../../config/db.js';

export const createPrescription = async (khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan) => {
    const query = `
        INSERT INTO ToaThuoc (khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, hinh_anh_toa, trang_thai_duyet, ngay_tao;
    `;
    const result = await pool.query(query, [khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan]);
    return result.rows[0];
};