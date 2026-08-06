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
            lsp.ghi_chu,
            dv_tu.ten_don_vi AS tu_kho,
            dv_den.ten_don_vi AS den_kho
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
    return parseInt(result.rows[0].risk_score);
};

// Returns all scan stats needed to display the two SQL fraud checks in the UI:
// 1. Scan frequency (>=10 per minute in last 24h → fraud)
// 2. Movement speed (>1000 km/h between any two scans → fraud)
const getScanDetails = async (uid) => {
    // All-time totals + first/last scan dates
    const totalsQuery = `
        SELECT COUNT(*) AS total_scans, MIN(thoi_gian_quet) AS first_scan, MAX(thoi_gian_quet) AS last_scan
        FROM NhatKyXacThuc
        WHERE hop_thuoc_uid = $1;
    `;

    // Max scans in any 1-minute window in last 24h — mirrors fn_check_qr_risk_score check #1
    const freqQuery = `
        SELECT COALESCE(MAX(scan_count), 0) AS max_per_minute
        FROM (
            SELECT COUNT(*) OVER (
                ORDER BY thoi_gian_quet
                RANGE BETWEEN INTERVAL '1 minute' PRECEDING AND CURRENT ROW
            ) AS scan_count
            FROM NhatKyXacThuc
            WHERE hop_thuoc_uid = $1
              AND thoi_gian_quet > NOW() - INTERVAL '24 hours'
        ) sub;
    `;

    // Whether any two consecutive location-tagged scans exceed 1000 km/h — mirrors fn_check_qr_risk_score check #2
    const speedQuery = `
        WITH ordered AS (
            SELECT
                toa_do_lat, toa_do_lng, thoi_gian_quet,
                LAG(toa_do_lat)     OVER (ORDER BY thoi_gian_quet) AS prev_lat,
                LAG(toa_do_lng)     OVER (ORDER BY thoi_gian_quet) AS prev_lng,
                LAG(thoi_gian_quet) OVER (ORDER BY thoi_gian_quet) AS prev_time
            FROM NhatKyXacThuc
            WHERE hop_thuoc_uid = $1 AND toa_do_lat IS NOT NULL
        )
        SELECT EXISTS (
            SELECT 1 FROM ordered
            WHERE prev_lat IS NOT NULL
              AND EXTRACT(EPOCH FROM (thoi_gian_quet - prev_time)) > 0
              AND fn_tinh_khoang_cach_km(prev_lat, prev_lng, toa_do_lat, toa_do_lng)
                  / (EXTRACT(EPOCH FROM (thoi_gian_quet - prev_time)) / 3600) > 1000
        ) AS has_anomaly;
    `;

    const [totals, freq, speed] = await Promise.all([
        pool.query(totalsQuery, [uid]),
        pool.query(freqQuery,   [uid]),
        pool.query(speedQuery,  [uid]),
    ]);

    return {
        total:             parseInt(totals.rows[0].total_scans)     || 0,
        firstScan:         totals.rows[0].first_scan                || null,
        lastScan:          totals.rows[0].last_scan                 || null,
        maxPerMinute:      parseInt(freq.rows[0].max_per_minute)    || 0,
        hasLocationAnomaly: speed.rows[0].has_anomaly === true,
    };
};

export { getBoxInfo, insertScanLog, getDistributionHistory, getQRRiskScore, getScanDetails };