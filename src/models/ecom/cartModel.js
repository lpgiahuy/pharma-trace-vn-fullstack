import pool from '../../config/db.js';

const getCartItems = async (userId) => {
    const query = `
        SELECT ctg.id AS cart_item_id, ctg.duoc_pham_id, ctg.quy_cach_id, ctg.so_luong,
               dp.ten_thuoc, dp.hinh_anh_url, qc.ten_don_vi, qc.gia_ban,
               -- XÓA DÒNG: qc.he_so_quy_doi (Vì đã xóa cột này trong DB)
               (ctg.so_luong * qc.gia_ban) AS thanh_tien
        FROM ChiTietGioHang ctg
        JOIN DuocPham dp ON ctg.duoc_pham_id = dp.id
        JOIN QuyCachDongGoi qc ON ctg.quy_cach_id = qc.id
        WHERE ctg.khach_hang_id = $1
        ORDER BY ctg.ngay_them DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const upsertCartItem = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    // ensure cart exists for user (if not, create an empty cart)
    await pool.query('INSERT INTO GioHang (khach_hang_id) VALUES ($1) ON CONFLICT (khach_hang_id) DO NOTHING', [userId]);

    // add or update cart item
    const query = `
        INSERT INTO ChiTietGioHang (khach_hang_id, duoc_pham_id, quy_cach_id, so_luong)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (khach_hang_id, duoc_pham_id, quy_cach_id)
        DO UPDATE SET so_luong = ChiTietGioHang.so_luong + EXCLUDED.so_luong, 
                      ngay_them = CURRENT_TIMESTAMP
        RETURNING *;
    `;
    const result = await pool.query(query, [userId, duoc_pham_id, quy_cach_id, so_luong]);
    return result.rows[0];
};

const updateItemQuantity = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    const query = `
        UPDATE ChiTietGioHang 
        SET so_luong = $4, ngay_them = CURRENT_TIMESTAMP
        WHERE khach_hang_id = $1 AND duoc_pham_id = $2 AND quy_cach_id = $3
        RETURNING *;
    `;
    const result = await pool.query(query, [userId, duoc_pham_id, quy_cach_id, so_luong]);
    return result.rows[0];
};

const removeCartItem = async (userId, duoc_pham_id, quy_cach_id) => {
    let query;
    let params;

    if (quy_cach_id) {
        query = `DELETE FROM ChiTietGioHang WHERE khach_hang_id = $1 AND duoc_pham_id = $2 AND quy_cach_id = $3`;
        params = [userId, duoc_pham_id, quy_cach_id];
    } else {
        query = `DELETE FROM ChiTietGioHang WHERE khach_hang_id = $1 AND duoc_pham_id = $2`;
        params = [userId, duoc_pham_id];
    }
    
    const result = await pool.query(query, params);
    return result.rowCount > 0;
};

export { getCartItems, upsertCartItem, updateItemQuantity, removeCartItem };