import prisma, { serializeBigInt } from '../../config/prisma.js';

const getUnitId = (userContext) => {
    if (!userContext) return null;
    if (userContext.role === 'SuperAdmin' && !userContext.force_unit_id) return null;
    return userContext.force_unit_id ? Number(userContext.force_unit_id) : (userContext.don_vi_id ? Number(userContext.don_vi_id) : null);
};

// get coordinates of suspicious QR code scans for heatmap visualization
const getHeatmapData = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    let query = 'SELECT * FROM View_DiemNong_HangGia';
    const params = [];
    if (unitId) {
        query += ' WHERE don_vi_id = $1';
        params.push(unitId);
    }
    query += ' LIMIT 100;';
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

// get list of medicines nearing expiry (within 60 days)
const getNearExpiredDrugs = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    let query = 'SELECT * FROM View_Thuoc_Can_Date';
    const params = [];
    if (unitId) {
        query += ' WHERE don_vi_id = $1';
        params.push(unitId);
    }
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

// get daily revenue data for revenue trend chart
const getDailyRevenue = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    let query = 'SELECT * FROM View_DoanhThu_Theo_Ngay';
    const params = [];
    if (unitId) {
        query += ' WHERE don_vi_id = $1';
        params.push(unitId);
    }
    query += ' LIMIT 30;';
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

// get overall inventory summary by warehouse
const getInventorySummary = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    let query = 'SELECT * FROM View_TonKho_ChiTiet';
    const params = [];
    if (unitId) {
        query += ' WHERE don_vi_id = $1';
        params.push(unitId);
    }
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

export { getHeatmapData, getNearExpiredDrugs, getDailyRevenue, getInventorySummary };

export const getOverallStats = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    const unitCond = unitId ? ` AND EXISTS (SELECT 1 FROM ChiTietDonHang ctdh WHERE ctdh.don_hang_id = dh.id AND ctdh.don_vi_xuat_id = ${unitId})` : '';
    const tkCond = unitId ? ` AND don_vi_id = ${unitId}` : '';

    const query = `
    SELECT 
        (SELECT COALESCE(SUM(tong_tien), 0) FROM DonHang dh WHERE trang_thai_don = 'HoanThanh' AND ngay_dat_hang >= (CURRENT_DATE - INTERVAL '30 days')${unitCond}) as rev_current,
        (SELECT COALESCE(SUM(tong_tien), 0) FROM DonHang dh WHERE trang_thai_don = 'HoanThanh' AND ngay_dat_hang >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_dat_hang < (CURRENT_DATE - INTERVAL '30 days')${unitCond}) as rev_prev,
        (SELECT COUNT(*) FROM DonHang dh WHERE ngay_dat_hang >= (CURRENT_DATE - INTERVAL '30 days') AND trang_thai_don != 'DaHuy'${unitCond}) as orders_current,
        (SELECT COUNT(*) FROM DonHang dh WHERE ngay_dat_hang >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_dat_hang < (CURRENT_DATE - INTERVAL '30 days') AND trang_thai_don != 'DaHuy'${unitCond}) as orders_prev,
        (SELECT COUNT(*) FROM KhachHang WHERE ngay_tao >= (CURRENT_DATE - INTERVAL '30 days')) as cust_current,
        (SELECT COUNT(*) FROM KhachHang WHERE ngay_tao >= (CURRENT_DATE - INTERVAL '60 days') AND ngay_tao < (CURRENT_DATE - INTERVAL '30 days')) as cust_prev,
        (SELECT COUNT(DISTINCT duoc_pham_id) FROM TonKho WHERE so_luong_ton < 20${tkCond}) as low_stock_count
    `;
    const result = await prisma.$queryRawUnsafe(query);
    return serializeBigInt(result[0]);
};

export const getMonthlyRevenueChart = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    const joinCond = unitId ? ` AND EXISTS (SELECT 1 FROM ChiTietDonHang ctdh WHERE ctdh.don_hang_id = dh.id AND ctdh.don_vi_xuat_id = ${unitId})` : '';

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
            ON date_trunc('month', dh.ngay_dat_hang) = m.month_start${joinCond}
        GROUP BY m.month_start
        ORDER BY m.month_start ASC;
    `;
    const result = await prisma.$queryRawUnsafe(query);
    return serializeBigInt(result);
};

export const getTopSellingProducts = async (limit, userContext = null) => {
    const unitId = getUnitId(userContext);
    let query;
    const params = [Number(limit)];
    if (unitId) {
        query = `
            SELECT 
                dp.id,
                dp.ten_thuoc as name,
                dm.ten_danh_muc as category,
                COALESCE(SUM(ct.so_luong), 0)::int as "soldCount",
                COALESCE((SELECT gia_ban FROM QuyCachDongGoi WHERE duoc_pham_id = dp.id LIMIT 1), 0) as price
            FROM DuocPham dp
            LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
            JOIN ChiTietDonHang ct ON ct.duoc_pham_id = dp.id AND ct.don_vi_xuat_id = $2
            JOIN DonHang dh ON ct.don_hang_id = dh.id AND dh.trang_thai_don = 'HoanThanh'
            GROUP BY dp.id, dp.ten_thuoc, dm.ten_danh_muc
            ORDER BY "soldCount" DESC
            LIMIT $1;
        `;
        params.push(unitId);
    } else {
        query = `
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
    }
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

export const getCategoryRevenue = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    const params = [];
    let whereUnit = '';
    if (unitId) {
        whereUnit = ' AND ct.don_vi_xuat_id = $1';
        params.push(unitId);
    }

    const query = `
        SELECT
            COALESCE(dm.ten_danh_muc, 'Khác') AS category,
            COALESCE(SUM(ct.so_luong * ct.don_gia), 0)::bigint AS revenue
        FROM DonHang dh
        JOIN ChiTietDonHang ct ON dh.id = ct.don_hang_id
        JOIN DuocPham dp ON ct.duoc_pham_id = dp.id
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        WHERE dh.trang_thai_don = 'HoanThanh'${whereUnit}
        GROUP BY dm.ten_danh_muc
        ORDER BY revenue DESC;
    `;
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

export const getCategoryProductCount = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    const params = [];
    let joinUnit = '';
    if (unitId) {
        joinUnit = ' JOIN TonKho tk ON tk.duoc_pham_id = dp.id AND tk.don_vi_id = $1';
        params.push(unitId);
    }
    const query = `
        SELECT
            COALESCE(parent.ten_danh_muc, dm.ten_danh_muc, 'Khác') AS category,
            COUNT(dp.id)::int                                         AS count
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm     ON dp.danh_muc_id      = dm.id
        LEFT JOIN DanhMuc parent ON dm.danh_muc_cha_id  = parent.id
        ${joinUnit}
        WHERE dp.trang_thai = TRUE
        GROUP BY COALESCE(parent.ten_danh_muc, dm.ten_danh_muc, 'Khác')
        ORDER BY count DESC;
    `;
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

export const getLowStockItems = async (userContext = null) => {
    const unitId = getUnitId(userContext);
    const params = [];
    let whereUnit = '';
    if (unitId) {
        whereUnit = ' AND tk.don_vi_id = $1';
        params.push(unitId);
    }

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
        WHERE tk.so_luong_ton < 50${whereUnit}
        ORDER BY tk.so_luong_ton ASC
        LIMIT 10;
    `;
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};