import pool from '../../config/db.js';

export const getAllRmaRequests = async () => {
    const query = `
        SELECT p.*, k.ho_ten, k.so_dien_thoai 
        FROM PhieuTraHang p
        JOIN KhachHang k ON p.khach_hang_id = k.id
        ORDER BY p.ngay_yeu_cau DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const updateRmaStatus = async (id, trang_thai_duyet) => {
    const query = `
        UPDATE PhieuTraHang 
        SET trang_thai_duyet = $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const result = await pool.query(query, [trang_thai_duyet, id]);
    return result.rows[0];
};