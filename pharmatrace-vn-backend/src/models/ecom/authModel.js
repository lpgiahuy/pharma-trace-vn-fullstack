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

const findUserById = async (id) => {
    const query = 'SELECT id, ho_ten, so_dien_thoai, email, dia_chi_mac_dinh AS dia_chi, hang_thanh_vien, diem_tich_luy FROM KhachHang WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// Find full user record (including password hash) for password change verification
const findFullUserById = async (id) => {
    const query = 'SELECT * FROM KhachHang WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateUserProfile = async (id, { ho_ten, email, dia_chi_mac_dinh }) => {
    const query = `
        UPDATE KhachHang 
        SET ho_ten           = COALESCE($2, ho_ten),
            email            = COALESCE($3, email),
            dia_chi_mac_dinh = COALESCE($4, dia_chi_mac_dinh)
        WHERE id = $1
        RETURNING id, ho_ten, so_dien_thoai, email, dia_chi_mac_dinh AS dia_chi, hang_thanh_vien, diem_tich_luy;
    `;
    const result = await pool.query(query, [id, ho_ten || null, email || null, dia_chi_mac_dinh || null]);
    return result.rows[0];
};

const updateUserPassword = async (id, newHashedPassword) => {
    const query = `UPDATE KhachHang SET mat_khau_hash = $2 WHERE id = $1`;
    await pool.query(query, [id, newHashedPassword]);
    return true;
};

const getLoyaltyUpgradeProgress = async (id) => {
    const query = 'SELECT * FROM fn_get_loyalty_upgrade_progress($1)';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

export { findUserByPhone, createUser, findUserById, findFullUserById, updateUserProfile, updateUserPassword, getLoyaltyUpgradeProgress };