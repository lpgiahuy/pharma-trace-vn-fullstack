import pool from '../../config/db.js';

const callCheckoutProcedure = async (userId, dia_chi_giao, phuong_thuc_tt, ma_giam_gia, diem_su_dung) => {
    const query = `CALL sp_tao_don_hang_tu_gio($1, $2, $3, $4, $5)`;
    
    // Note: procedure does not using RETURNING like normal table
    await pool.query(query, [userId, dia_chi_giao, phuong_thuc_tt, ma_giam_gia, diem_su_dung]);
    
    // after calling procedure, we need to query again to get the new order's details because the procedure does not return it directly
    const orderQuery = `SELECT * FROM DonHang WHERE khach_hang_id = $1 ORDER BY ngay_dat_hang DESC LIMIT 1`;
    const result = await pool.query(orderQuery, [userId]);
    
    return result.rows[0];
};

export { callCheckoutProcedure };