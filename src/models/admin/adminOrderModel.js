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

    // ordered medicines info
    const itemsQuery = `
        SELECT ct.id, dp.ten_thuoc, qc.ten_don_vi, ct.so_luong, ct.don_gia
        FROM ChiTietDonHang ct
        JOIN DuocPham dp ON ct.duoc_pham_id = dp.id
        JOIN QuyCachDongGoi qc ON ct.quy_cach_id = qc.id
        WHERE ct.don_hang_id = $1;
    `;
    const itemsRes = await pool.query(itemsQuery, [orderId]);

    const order = orderRes.rows[0];
    order.chi_tiet_thuoc = itemsRes.rows;
    return order;
};

// pack order with provided array of medicine box UIDs (called by procedure in database)
const packOrderWithUIDs = async (orderId, mang_uid) => {
    // Convert array of UUIDs to PostgreSQL array string format
    const pgArrayString = `{${mang_uid.join(',')}}`;
    const query = `CALL sp_dong_goi_don_hang($1::INT, $2::UUID[])`;

    await pool.query(query, [orderId, pgArrayString]);
    return true;
};

export { getAllOrders, getOrderDetail, packOrderWithUIDs }