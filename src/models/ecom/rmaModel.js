import pool from '../../config/db.js';

const createRmaRequest = async (khach_hang_id, don_hang_id, ly_do_tra) => {
    const query = `
        INSERT INTO PhieuTraHang (khach_hang_id, don_hang_id, ly_do_tra)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await pool.query(query, [khach_hang_id, don_hang_id, ly_do_tra]);
    return result.rows[0];
};

export { createRmaRequest };