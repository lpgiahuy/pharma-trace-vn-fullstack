import pool from '../../config/db.js';

// Check if user exists by phone number
const findUserByPhone = async (phone) => {
    const query = 'SELECT * FROM KhachHang WHERE so_dien_thoai = $1';
    const result = await pool.query(query, [phone]);
    return result.rows[0];
};

const createUser = async (name, phone, hashedPassword) => {
    const query = `
        INSERT INTO KhachHang (ho_ten, so_dien_thoai, mat_khau_hash) 
        VALUES ($1, $2, $3) RETURNING id, ho_ten, so_dien_thoai, hang_thanh_vien, diem_tich_luy;
    `;
    const result = await pool.query(query, [name, phone, hashedPassword]);
    return result.rows[0];
};

export { findUserByPhone, createUser };