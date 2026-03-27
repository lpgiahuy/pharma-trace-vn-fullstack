import pool from '../../config/db.js';

// create a new review for a product by a customer
const createReview = async (khach_hang_id, duoc_pham_id, so_sao, noi_dung) => {
    const query = `
        INSERT INTO DanhGiaSanPham (khach_hang_id, duoc_pham_id, so_sao, noi_dung)
        VALUES ($1, $2, $3, $4)
        RETURNING id, so_sao, noi_dung, ngay_danh_gia;
    `;
    const result = await pool.query(query, [khach_hang_id, duoc_pham_id, so_sao, noi_dung]);
    return result.rows[0];
};

// Get the list of reviews for a specific product (for display on app/web)
const getReviewsByProductId = async (duoc_pham_id) => {
    const query = `
        SELECT r.id, r.so_sao, r.noi_dung, r.ngay_danh_gia, k.ho_ten AS ten_khach_hang
        FROM DanhGiaSanPham r
        JOIN KhachHang k ON r.khach_hang_id = k.id
        WHERE r.duoc_pham_id = $1
        ORDER BY r.ngay_danh_gia DESC;
    `;
    const result = await pool.query(query, [duoc_pham_id]);
    return result.rows;
};

export { createReview, getReviewsByProductId };

//