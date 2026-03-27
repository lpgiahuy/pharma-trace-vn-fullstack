import pool from '../../config/db.js';

const getAllCategories = async (chi_lay_hoat_dong = false) => {
    let query = `SELECT * FROM DanhMuc`;
    // if customer is viewing, only get categories with "trang_thai = true"
    if (chi_lay_hoat_dong) query += ` WHERE trang_thai = TRUE`;
    query += ` ORDER BY thu_tu_hien_thi ASC, id DESC;`;
    
    const result = await pool.query(query);
    return result.rows;
};

const createCategory = async (ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi) => {
    const query = `
        INSERT INTO DanhMuc (ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const result = await pool.query(query, [ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi]);
    return result.rows[0];
};

const updateCategory = async (id, payload) => {
    const { ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi, trang_thai } = payload;
    const query = `
        UPDATE DanhMuc
        SET ten_danh_muc = COALESCE($1, ten_danh_muc),
            danh_muc_cha_id = COALESCE($2, danh_muc_cha_id),
            hinh_anh_icon = COALESCE($3, hinh_anh_icon),
            thu_tu_hien_thi = COALESCE($4, thu_tu_hien_thi),
            trang_thai = COALESCE($5, trang_thai)
        WHERE id = $6
        RETURNING *;
    `;
    const result = await pool.query(query, [ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi, trang_thai, id]);
    return result.rows[0];
};

const softDeleteCategory = async (id) => {
    const query = `UPDATE DanhMuc SET trang_thai = FALSE WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
};

export { getAllCategories, createCategory, updateCategory, softDeleteCategory };