import pool from '../../config/db.js';

// find employee by email (used for login)
const getEmployeeByEmail = async (email) => {
    const query = `
        SELECT id, don_vi_id, ho_ten, email, mat_khau_hash, vai_tro 
        FROM NhanVien 
        WHERE email = $1 AND trang_thai = TRUE;
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

// helper function to create the first SuperAdmin (used during system initialization)
const createFirstAdmin = async (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro) => {
    const query = `
        INSERT INTO NhanVien (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, ho_ten, email, vai_tro;
    `;
    const result = await pool.query(query, [don_vi_id, ho_ten, email, mat_khau_hash, vai_tro]);
    return result.rows[0];
};

export { getEmployeeByEmail, createFirstAdmin };