import pool from '../../config/db.js';

// get info box by uid 
const   getBoxInfo = async (uid) => {
    const query = `
        SELECT ht.uid, ht.trang_thai, lt.so_lo, lt.han_su_dung, dp.ten_thuoc
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        JOIN DuocPham dp ON lt.duoc_pham_id = dp.id
        WHERE ht.uid = $1;
    `;
    const result = await pool.query(query, [uid]);
    return result.rows[0];
};

// insert log scan
const insertScanLog = async (uid, lat, lng, ip) => {
    const query = `
        INSERT INTO NhatKyXacThuc (hop_thuoc_uid, toa_do_lat, toa_do_lng, ip_address) 
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await pool.query(query, [uid, lat, lng, ip]);
    return result.rows[0];
};

// get distribution history by uid
const getDistributionHistory = async (uid) => {
    const query = `
        SELECT 
            lsp.loai_giao_dich, 
            lsp.thoi_gian, 
            -- Nếu tu_kho bị null, tự động thay bằng chữ 'Hệ thống'
            COALESCE(dv_tu.ten_don_vi, 'Hệ thống') AS tu_kho, 
            
            -- Nếu den_kho bị null, tự động thay bằng chữ 'Khách hàng'
            COALESCE(dv_den.ten_don_vi, 'Khách hàng') AS den_kho
        FROM LichSuPhanPhoi lsp
        LEFT JOIN DonVi dv_tu ON lsp.tu_don_vi_id = dv_tu.id
        LEFT JOIN DonVi dv_den ON lsp.den_don_vi_id = dv_den.id
        WHERE lsp.hop_thuoc_uid = $1
        ORDER BY lsp.thoi_gian ASC;
    `;
    const result = await pool.query(query, [uid]);
    return result.rows;
};

const getQRRiskScore = async (uid) => {
    const query = `SELECT fn_check_qr_risk_score($1) AS risk_score;`;
    const result = await pool.query(query, [uid]);
    // Kết quả trả về là một con số từ 0 đến 100
    return parseInt(result.rows[0].risk_score);
};

export { getBoxInfo, insertScanLog, getDistributionHistory, getQRRiskScore };