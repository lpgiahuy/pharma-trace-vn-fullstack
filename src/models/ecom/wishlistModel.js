import pool from '../../config/db.js';

// get wishlist of a customer
const getWishlist = async (khach_hang_id) => {
    const query = `
        SELECT dp.id AS duoc_pham_id, dp.ten_thuoc, dp.hinh_anh_url, dp.mo_ta_ngan, spy.ngay_them
        FROM SanPhamYeuThich spy
        JOIN DuocPham dp ON spy.duoc_pham_id = dp.id
        WHERE spy.khach_hang_id = $1
        ORDER BY spy.ngay_them DESC;
    `;
    const result = await pool.query(query, [khach_hang_id]);
    return result.rows;
};

// add product to wishlist (using ON CONFLICT to avoid duplicates)
const addToWishlist = async (khach_hang_id, duoc_pham_id) => {
    const query = `
        INSERT INTO SanPhamYeuThich (khach_hang_id, duoc_pham_id)
        VALUES ($1, $2)
        ON CONFLICT (khach_hang_id, duoc_pham_id) DO NOTHING
        RETURNING *;
    `;
    const result = await pool.query(query, [khach_hang_id, duoc_pham_id]);
    return result.rowCount > 0; // return true if a new row was inserted, false if it was a duplicate and ignored
};

// remove product from wishlist 
const removeFromWishlist = async (khach_hang_id, duoc_pham_id) => {
    const query = `
        DELETE FROM SanPhamYeuThich
        WHERE khach_hang_id = $1 AND duoc_pham_id = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [khach_hang_id, duoc_pham_id]);
    return result.rowCount > 0;
};

export { getWishlist, addToWishlist, removeFromWishlist };