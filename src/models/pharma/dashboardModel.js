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
    const query = 'SELECT * FROM View_DoanhThu_Theo_Ngay LIMIT 30;'; // Lấy 30 ngày gần nhất
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