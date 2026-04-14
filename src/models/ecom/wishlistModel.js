import pool from '../../config/db.js';

// get wishlist of a customer
const getWishlist = async (khach_hang_id) => {
    const query = `
        SELECT 
            dp.id, 
            dp.ten_thuoc, 
            dp.hinh_anh_url, 
            dp.mo_ta_ngan, 
            dp.la_thuoc_ke_don,
            dp.so_luong_da_ban,
            dp.diem_danh_gia,
            qc.gia_ban, 
            qc.ten_don_vi AS don_vi_ban,
            spy.ngay_them,
            (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) AS total_stock
        FROM SanPhamYeuThich spy
        JOIN DuocPham dp ON spy.duoc_pham_id = dp.id
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id AND qc.id = (SELECT MIN(id) FROM QuyCachDongGoi WHERE duoc_pham_id = dp.id)
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
    return result.rowCount > 0;
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

// check if a product is in wishlist
const checkIfFavorited = async (khach_hang_id, duoc_pham_id) => {
    const query = `SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $1 AND duoc_pham_id = $2`;
    const result = await pool.query(query, [khach_hang_id, duoc_pham_id]);
    return result.rowCount > 0;
};

export { getWishlist, addToWishlist, removeFromWishlist, checkIfFavorited };