import pool from '../../config/db.js';

// get all orders with customer info (for admin dashboard)
const getAllOrders = async () => {
    const query = `
        SELECT dh.id, kh.ho_ten, kh.so_dien_thoai, dh.ngay_dat_hang, dh.tong_tien, 
               dh.phuong_thuc_thanh_toan, dh.trang_thai_thanh_toan, dh.trang_thai_don
        FROM DonHang dh
        JOIN KhachHang kh ON dh.khach_hang_id = kh.id
        ORDER BY dh.ngay_dat_hang DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// get detailed info of an order by id (including ordered medicines)
const getOrderDetail = async (orderId) => {
    // order info with customer info
    const orderQuery = `
        SELECT dh.*, kh.ho_ten, kh.so_dien_thoai, kh.email 
        FROM DonHang dh JOIN KhachHang kh ON dh.khach_hang_id = kh.id 
        WHERE dh.id = $1;
    `;
    const orderRes = await pool.query(orderQuery, [orderId]);
    if (orderRes.rowCount === 0) return null;

    // ordered medicines info (with product image and packaging details)
    const itemsQuery = `
        SELECT ct.id, ct.duoc_pham_id, dp.ten_thuoc, dp.hinh_anh_url, dp.la_thuoc_ke_don,
               qc.id as quy_cach_id, qc.ten_don_vi, ct.so_luong, ct.don_gia,
               ct.gia_goc_luc_mua, ct.phan_tram_giam_luc_mua, dv.ten_don_vi as don_vi_xuat
        FROM ChiTietDonHang ct
        JOIN DuocPham dp ON ct.duoc_pham_id = dp.id
        JOIN QuyCachDongGoi qc ON ct.quy_cach_id = qc.id
        LEFT JOIN DonVi dv ON ct.don_vi_xuat_id = dv.id
        WHERE ct.don_hang_id = $1;
    `;
    const itemsRes = await pool.query(itemsQuery, [orderId]);

    const order = orderRes.rows[0];
    order.chi_tiet_thuoc = itemsRes.rows;
    return order;
};

// Pack order with provided array of medicine box UIDs (called by procedure in database)
const packOrderWithUIDs = async (orderId, mang_uid) => {
    // Convert array of UUIDs to PostgreSQL array string format
    const pgArrayString = `{${mang_uid.join(',')}}`;
    const query = `CALL sp_dong_goi_don_hang($1::INT, $2::UUID[])`;

    await pool.query(query, [orderId, pgArrayString]);
    return true;
};

// Start shipping an order (DaDongGoi → DangGiao)
const startShippingOrder = async (orderId) => {
    const query = `CALL sp_xuat_giao_don_hang($1::INT)`;
    await pool.query(query, [orderId]);
    return true;
};

// Mark order as completed using stored procedure (DangGiao → HoanThanh)
const completeOrder = async (orderId) => {
    const query = `CALL sp_hoan_thanh_don_hang($1::INT)`;
    await pool.query(query, [orderId]);

    // Re-fetch order info after completion to return to the frontend
    const result = await pool.query(
        `SELECT id, trang_thai_don, trang_thai_thanh_toan FROM DonHang WHERE id = $1`,
        [orderId]
    );
    return result.rows[0];
};

// Update payment status (used by admin or payment webhook)
const updatePaymentStatus = async (orderId, trang_thai_thanh_toan, ma_giao_dich) => {
    const query = `
        UPDATE DonHang 
        SET trang_thai_thanh_toan = $2,
            ma_giao_dich_ngan_hang = COALESCE($3, ma_giao_dich_ngan_hang)
        WHERE id = $1
        RETURNING id, trang_thai_don, trang_thai_thanh_toan, ma_giao_dich_ngan_hang;
    `;
    const result = await pool.query(query, [orderId, trang_thai_thanh_toan, ma_giao_dich || null]);
    return result.rows[0];
};

export { getAllOrders, getOrderDetail, packOrderWithUIDs, startShippingOrder, completeOrder, updatePaymentStatus }