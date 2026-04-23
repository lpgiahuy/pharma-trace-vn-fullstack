import pool from '../../config/db.js';

/**
 * Create a new KienHang (bundle/pallet) record.
 */
const createKienHang = async (ma_sscc, loai_kien, don_vi_so_huu_id) => {
    const query = `
        INSERT INTO KienHang (ma_sscc, loai_kien, don_vi_so_huu_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await pool.query(query, [ma_sscc, loai_kien, don_vi_so_huu_id]);
    return result.rows[0];
};

/**
 * Get a single KienHang record + the list of medicine box UIDs inside it.
 */
const getKienHangBySSCC = async (ma_sscc) => {
    // Get the bundle itself
    const bundleRes = await pool.query(
        `SELECT kh.*, dv.ten_don_vi AS ten_don_vi_so_huu
         FROM KienHang kh
         LEFT JOIN DonVi dv ON kh.don_vi_so_huu_id = dv.id
         WHERE kh.ma_sscc = $1;`,
        [ma_sscc]
    );
    if (bundleRes.rowCount === 0) return null;

    // Get all medicine boxes inside this bundle
    const uidsRes = await pool.query(
        `SELECT ht.uid, ht.trang_thai, lt.so_lo, lt.han_su_dung, dp.ten_thuoc
         FROM HopThuoc ht
         JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
         JOIN DuocPham dp ON lt.duoc_pham_id = dp.id
         WHERE ht.kien_hang_id = $1
         ORDER BY dp.ten_thuoc ASC;`,
        [bundleRes.rows[0].id]
    );

    const bundle = bundleRes.rows[0];
    bundle.so_luong_hop = uidsRes.rowCount;
    bundle.danh_sach_hop = uidsRes.rows;
    return bundle;
};

/**
 * Get all KienHang records belonging to a specific warehouse unit.
 */
const getKienHangByDonVi = async (don_vi_id) => {
    const query = `
        SELECT kh.*, 
               dv.ten_don_vi AS ten_don_vi_so_huu,
               COUNT(ht.uid) AS so_luong_hop
        FROM KienHang kh
        LEFT JOIN DonVi dv ON kh.don_vi_so_huu_id = dv.id
        LEFT JOIN HopThuoc ht ON kh.id = ht.kien_hang_id
        WHERE kh.don_vi_so_huu_id = $1
        GROUP BY kh.id, dv.ten_don_vi
        ORDER BY kh.ngay_tao DESC;
    `;
    const result = await pool.query(query, [don_vi_id]);
    return result.rows;
};

/**
 * Get all KienHang (for SuperAdmin view).
 */
const getAllKienHang = async () => {
    const query = `
        SELECT kh.*, 
               dv.ten_don_vi AS ten_don_vi_so_huu,
               COUNT(ht.uid) AS so_luong_hop
        FROM KienHang kh
        LEFT JOIN DonVi dv ON kh.don_vi_so_huu_id = dv.id
        LEFT JOIN HopThuoc ht ON kh.id = ht.kien_hang_id
        GROUP BY kh.id, dv.ten_don_vi
        ORDER BY kh.ngay_tao DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * Assign a batch of medicine box UIDs to a KienHang (by kien_hang_id).
 */
const assignUIDsToKienHang = async (kien_hang_id, mang_uid) => {
    const pgArray = `{${mang_uid.join(',')}}`;
    const query = `
        UPDATE HopThuoc
        SET kien_hang_id = $1
        WHERE uid = ANY($2::UUID[])
        RETURNING uid;
    `;
    const result = await pool.query(query, [kien_hang_id, pgArray]);
    return result.rows;
};

/**
 * Resolve SSCC → array of active UIDs (used before calling individual UID procedures).
 */
const getUIDsBySSCC = async (ma_sscc) => {
    const query = `
        SELECT ht.uid
        FROM HopThuoc ht
        JOIN KienHang kh ON ht.kien_hang_id = kh.id
        WHERE kh.ma_sscc = $1
          AND ht.trang_thai NOT IN ('HuyBo', 'ThuHoi');
    `;
    const result = await pool.query(query, [ma_sscc]);
    return result.rows.map(r => r.uid);
};

/**
 * Call the database stored procedure to transfer an entire KienHang to another unit.
 * This single procedure call updates KienHang owner, all HopThuoc locations,
 * and writes bulk history logs in one atomic transaction.
 */
const callTransferKienHangProcedure = async (ma_sscc, den_don_vi_id) => {
    const query = `CALL sp_luan_chuyen_kien_hang($1::VARCHAR, $2::INT)`;
    await pool.query(query, [ma_sscc, den_don_vi_id]);
    return true;
};

/**
 * Update KienHang status (e.g. 'SanSang' → 'DangGiao' → 'DaNhan').
 */
const updateKienHangStatus = async (ma_sscc, trang_thai) => {
    const query = `
        UPDATE KienHang SET trang_thai = $1 WHERE ma_sscc = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [trang_thai, ma_sscc]);
    return result.rows[0];
};

export {
    createKienHang,
    getKienHangBySSCC,
    getKienHangByDonVi,
    getAllKienHang,
    assignUIDsToKienHang,
    getUIDsBySSCC,
    callTransferKienHangProcedure,
    updateKienHangStatus,
};
