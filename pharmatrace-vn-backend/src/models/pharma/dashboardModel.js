import pool from '../../config/db.js';

// get coordinates of suspicious QR code scans for heatmap visualization
const getHeatmapData = async () => {
    const query = 'SELECT * FROM View_DiemNong_HangGia LIMIT 100;';
    const result = await pool.query(query);
    return result.rows;
};

// get list of medicines nearing expiry (within 60 days)
const getNearExpiredDrugs = async () => {
    const query = 'SELECT * FROM View_Thuoc_Can_Date;';
    const result = await pool.query(query);
    return result.rows;
};

// get daily revenue data for revenue trend chart
const getDailyRevenue = async () => {
    const query = 'SELECT * FROM View_DoanhThu_Theo_Ngay LIMIT 30;'; // Fetch last 30 days
    const result = await pool.query(query);
    return result.rows;
};

// get overall inventory summary by warehouse (total products in stock, etc.)
const getInventorySummary = async () => {
    const query = 'SELECT * FROM View_TonKho_ChiTiet;';
    const result = await pool.query(query);
    return result.rows;
};

export { getHeatmapData, getNearExpiredDrugs, getDailyRevenue, getInventorySummary };

// --- NEW QUERIES FOR FRONTEND REACT DASHBOARD ---

export const getOverallStats = async () => {
    const query = `
    SELECT 
        (SELECT COALESCE(SUM(tong_tien), 0) FROM DonHang WHERE trang_thai_don = 'HoanThanh' AND ngay_dat_hang >= (CURRENT_DATE - INTERVAL '30 days')) as rev_current,
        (SELECT COALESCE(SUM(tong_tien), 0) FROM DonHang WHERE trang_thai_don = 'HoanThanh' AND ngay_dat_hang >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_dat_hang < (CURRENT_DATE - INTERVAL '30 days')) as rev_prev,
        (SELECT COUNT(*) FROM DonHang WHERE ngay_dat_hang >= (CURRENT_DATE - INTERVAL '30 days') AND trang_thai_don != 'DaHuy') as orders_current,
        (SELECT COUNT(*) FROM DonHang WHERE ngay_dat_hang >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_dat_hang < (CURRENT_DATE - INTERVAL '30 days') AND trang_thai_don != 'DaHuy') as orders_prev,
        (SELECT COUNT(*) FROM KhachHang WHERE ngay_tao >= (CURRENT_DATE - INTERVAL '30 days')) as cust_current,
        (SELECT COUNT(*) FROM KhachHang WHERE ngay_tao >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_tao < (CURRENT_DATE - INTERVAL '30 days')) as cust_prev,
        (SELECT COUNT(DISTINCT duoc_pham_id) FROM TonKho WHERE so_luong_ton < 20) as low_stock_count
    `;
    const res = await pool.query(query);
    return res.rows[0];
};

export const getMonthlyRevenueChart = async () => {
    const query = `
        WITH months AS (
            SELECT generate_series(
                date_trunc('month', CURRENT_DATE - INTERVAL '5 months'), 
                date_trunc('month', CURRENT_DATE), 
                '1 month'
            )::date AS month_start
        )
        SELECT
            to_char(m.month_start, 'Mon') as month,
            COALESCE(SUM(
                CASE WHEN dh.trang_thai_don = 'HoanThanh' THEN dh.tong_tien ELSE 0 END
            ), 0) as revenue,
            COUNT(
                CASE WHEN dh.trang_thai_don != 'DaHuy' THEN dh.id END
            ) as orders
        FROM months m
        LEFT JOIN DonHang dh
            ON date_trunc('month', dh.ngay_dat_hang) = m.month_start
        GROUP BY m.month_start
        ORDER BY m.month_start ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
};

export const getTopSellingProducts = async (limit) => {
    const query = `
        SELECT 
            dp.id,
            dp.ten_thuoc as name,
            dm.ten_danh_muc as category,
            COALESCE(dp.so_luong_da_ban, 0) as "soldCount",
            COALESCE((SELECT gia_ban FROM QuyCachDongGoi WHERE duoc_pham_id = dp.id LIMIT 1), 0) as price
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        ORDER BY dp.so_luong_da_ban DESC NULLS LAST
        LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
};

export const getCategoryRevenue = async () => {
    const query = `
        SELECT
            COALESCE(dm.ten_danh_muc, 'Khác') AS category,
            COALESCE(SUM(ct.so_luong * ct.don_gia), 0)::bigint AS revenue
        FROM DonHang dh
        JOIN ChiTietDonHang ct ON dh.id = ct.don_hang_id
        JOIN DuocPham dp ON ct.duoc_pham_id = dp.id
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        WHERE dh.trang_thai_don = 'HoanThanh'
        GROUP BY dm.ten_danh_muc
        ORDER BY revenue DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
};

export const getCategoryProductCount = async () => {
    const query = `
        SELECT
            COALESCE(parent.ten_danh_muc, dm.ten_danh_muc, 'Khác') AS category,
            COUNT(dp.id)::int                                         AS count
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm     ON dp.danh_muc_id      = dm.id
        LEFT JOIN DanhMuc parent ON dm.danh_muc_cha_id  = parent.id
        WHERE dp.trang_thai = TRUE
        GROUP BY COALESCE(parent.ten_danh_muc, dm.ten_danh_muc, 'Khác')
        ORDER BY count DESC;
    `;
    const res = await pool.query(query);
    return res.rows;
};

export const getLowStockItems = async () => {
    const query = `
        SELECT 
            tk.duoc_pham_id as id,
            dp.ten_thuoc as "productName",
            dv.ten_don_vi as location,
            tk.so_luong_ton as quantity,
            TO_CHAR((SELECT han_su_dung FROM LoThuoc WHERE duoc_pham_id = dp.id AND trang_thai = 'HopLe' ORDER BY han_su_dung ASC LIMIT 1), 'YYYY-MM-DD') as "expiryDate"
        FROM TonKho tk
        JOIN DuocPham dp ON tk.duoc_pham_id = dp.id
        JOIN DonVi dv ON tk.don_vi_id = dv.id
        WHERE tk.so_luong_ton < 50
        ORDER BY tk.so_luong_ton ASC
        LIMIT 10;
    `;
    const res = await pool.query(query);
    return res.rows;
};