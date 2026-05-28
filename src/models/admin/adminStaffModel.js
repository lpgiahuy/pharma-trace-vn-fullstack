import pool from '../../config/db.js';

// get list of all staff members (including their assigned unit)
const getAllStaff = async () => {
    const query = `
        SELECT nv.id, nv.ho_ten, nv.email, nv.vai_tro, nv.trang_thai, dv.ten_don_vi, nv.don_vi_id
        FROM NhanVien nv
        LEFT JOIN DonVi dv ON nv.don_vi_id = dv.id
        WHERE nv.trang_thai = TRUE
        ORDER BY nv.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// create new staff account
const createStaff = async (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro) => {
    const query = `
        INSERT INTO NhanVien (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, ho_ten, email, vai_tro;
    `;
    const result = await pool.query(query, [don_vi_id, ho_ten, email, mat_khau_hash, vai_tro]);
    return result.rows[0];
};

// update staff information (except password)
const updateStaff = async (id, don_vi_id, ho_ten, vai_tro, trang_thai) => {
    const query = `
        UPDATE NhanVien 
        SET don_vi_id = COALESCE($1, don_vi_id),
            ho_ten = COALESCE($2, ho_ten),
            vai_tro = COALESCE($3, vai_tro),
            trang_thai = COALESCE($4, trang_thai)
        WHERE id = $5
        RETURNING id, ho_ten, vai_tro, trang_thai;
    `;
    const result = await pool.query(query, [don_vi_id, ho_ten, vai_tro, trang_thai, id]);
    return result.rows[0];
};

// disable staff account (soft delete)
const softDeleteStaff = async (id) => {
    const query = `UPDATE NhanVien SET trang_thai = FALSE WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
};

export { getAllStaff, createStaff, updateStaff, softDeleteStaff };