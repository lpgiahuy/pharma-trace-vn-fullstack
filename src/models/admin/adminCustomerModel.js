import pool from '../../config/db.js';

// Get list of all customers (for admin dashboard)
const getAllCustomers = async () => {
    const query = `
        SELECT id, ho_ten, so_dien_thoai, email, hang_thanh_vien, 
               diem_tich_luy, ngay_tao, trang_thai
        FROM KhachHang
        ORDER BY ngay_tao DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// Get customer detail by ID (includes order stats)
const getCustomerDetail = async (id) => {
    const customerQuery = `
        SELECT id, ho_ten, so_dien_thoai, email, dia_chi_mac_dinh,
               hang_thanh_vien, diem_tich_luy, ngay_tao, trang_thai
        FROM KhachHang WHERE id = $1;
    `;
    const customerRes = await pool.query(customerQuery, [id]);
    if (customerRes.rowCount === 0) return null;

    // Order statistics for this customer
    const statsQuery = `
        SELECT 
            COUNT(*) AS tong_don_hang,
            COALESCE(SUM(tong_tien), 0) AS tong_chi_tieu,
            COUNT(*) FILTER (WHERE trang_thai_don = 'HoanThanh') AS don_hoan_thanh,
            COUNT(*) FILTER (WHERE trang_thai_don = 'DaHuy')     AS don_da_huy
        FROM DonHang
        WHERE khach_hang_id = $1;
    `;
    const statsRes = await pool.query(statsQuery, [id]);

    const customer = customerRes.rows[0];
    customer.thong_ke_don_hang = statsRes.rows[0];
    return customer;
};

// Toggle account status: lock (FALSE) / unlock (TRUE)
const setCustomerStatus = async (id, trang_thai) => {
    const query = `
        UPDATE KhachHang 
        SET trang_thai = $2 
        WHERE id = $1 
        RETURNING id, ho_ten, trang_thai;
    `;
    const result = await pool.query(query, [id, trang_thai]);
    return result.rows[0];
};

export { getAllCustomers, getCustomerDetail, setCustomerStatus };
