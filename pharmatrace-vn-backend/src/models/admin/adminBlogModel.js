import pool from '../../config/db.js';

// get all blogs for public listing (customer view) - sorted by newest first, include author name
const getAllBlogs = async () => {
    const query = `
        SELECT b.id, b.tieu_de, b.anh_bia, b.noi_dung, b.ngay_dang, nv.ho_ten AS nguoi_dang
        FROM BaiViet b
        LEFT JOIN NhanVien nv ON b.nhan_vien_dang_id = nv.id
        ORDER BY b.ngay_dang DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// get detailed information of a blog post for reading
const getBlogById = async (id) => {
    const query = `
        SELECT b.id, b.tieu_de, b.anh_bia, b.noi_dung, b.ngay_dang, nv.ho_ten AS nguoi_dang
        FROM BaiViet b
        LEFT JOIN NhanVien nv ON b.nhan_vien_dang_id = nv.id
        WHERE b.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// create a new blog post
const createBlog = async (tieu_de, anh_bia, noi_dung, chuyen_muc, nhan_vien_dang_id) => {
    const query = `
        INSERT INTO BaiViet (tieu_de, anh_bia, noi_dung, nhan_vien_dang_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const result = await pool.query(query, [tieu_de, anh_bia, noi_dung, nhan_vien_dang_id]);
    return result.rows[0];
};

// update an existing blog post
const updateBlog = async (id, tieu_de, anh_bia, noi_dung, chuyen_muc) => {
    const query = `
        UPDATE BaiViet
        SET tieu_de = COALESCE($1, tieu_de),
            anh_bia = COALESCE($2, anh_bia),
            noi_dung = COALESCE($3, noi_dung)
        WHERE id = $4
        RETURNING *;
    `;
    const result = await pool.query(query, [tieu_de, anh_bia, noi_dung, id]);
    return result.rows[0];
};

// delete a blog post
const deleteBlog = async (id) => {
    const query = `DELETE FROM BaiViet WHERE id = $1 RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
};

export { getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog };