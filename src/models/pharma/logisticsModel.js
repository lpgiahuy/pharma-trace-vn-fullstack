import pool from '../../config/db.js';

const callTransferProcedure = async (tu_don_vi_id, den_don_vi_id, mang_uid) => {
    // convert JS array to PostgreSQL array string format: '{uuid1, uuid2}'
    const pgArrayString = `{${mang_uid.join(',')}}`;

    // cast parameters to correct types in the query: $1::INT, $2::INT, $3::UUID[]
    const query = `CALL sp_luan_chuyen_kho($1::INT, $2::INT, $3::UUID[])`;

    // Execute the stored procedure with the provided parameters
    await pool.query(query, [tu_don_vi_id, den_don_vi_id, pgArrayString]);

    return true;
};

// dispose of damaged or expired medicine boxes - will mark the boxes as "to be disposed" in the system and remove them from available stock
const disposeMedicine = async (don_vi_id, mang_uid, ly_do) => {
    // Cast JS array to PostgreSQL array string format
    const pgArrayString = `{${mang_uid.join(',')}}`;
    const query = `CALL sp_xuat_huy_thuoc($1::INT, $2::UUID[], $3::TEXT)`;

    await pool.query(query, [don_vi_id, pgArrayString, ly_do]);
    return true;
};

//  return medicine from customer back to warehouse - will mark the boxes as "returned" and add them back to stock
const returnMedicine = async (don_hang_id, don_vi_nhan_id, mang_uid) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    const query = `CALL sp_hoan_tra_thuoc($1::INT, $2::INT, $3::UUID[])`;

    await pool.query(query, [don_hang_id, don_vi_nhan_id, pgArrayString]);
    return true;
};

// recall entire batch of medicine across the system (in case of contamination, safety issue, etc.)
const recallBatch = async (lo_thuoc_id) => {
    const query = `CALL sp_thu_hoi_lo_thuoc($1::INT)`;
    await pool.query(query, [lo_thuoc_id]);
    return true;
};

const getAllUnits = async () => {
    const query = `SELECT id, ten_don_vi, loai_don_vi, dia_chi FROM DonVi ORDER BY id ASC`;
    const result = await pool.query(query);
    return result.rows;
};

const getProductsInUnit = async (don_vi_id) => {
    const query = `
        SELECT DISTINCT d.id, d.ten_thuoc, COUNT(h.uid) AS so_hop_trong_kho
        FROM HopThuoc h
        JOIN LoThuoc l ON h.lo_thuoc_id = l.id
        JOIN DuocPham d ON l.duoc_pham_id = d.id
        WHERE h.don_vi_hien_tai_id = $1
          AND h.trang_thai = 'TrongKho'
        GROUP BY d.id, d.ten_thuoc
        ORDER BY d.ten_thuoc ASC
    `;
    const result = await pool.query(query, [don_vi_id]);
    return result.rows;
};

const getBatchesInUnit = async (don_vi_id, duoc_pham_id) => {
    const query = `
        SELECT l.id, l.so_lo, l.han_su_dung, COUNT(h.uid) AS so_hop_trong_kho
        FROM HopThuoc h
        JOIN LoThuoc l ON h.lo_thuoc_id = l.id
        WHERE h.don_vi_hien_tai_id = $1
          AND l.duoc_pham_id = $2
          AND h.trang_thai = 'TrongKho'
        GROUP BY l.id, l.so_lo, l.han_su_dung
        ORDER BY l.han_su_dung ASC
    `;
    const result = await pool.query(query, [don_vi_id, duoc_pham_id]);
    return result.rows;
};

const getUIDsForTransfer = async (don_vi_id, lo_thuoc_id, so_luong) => {
    const query = `
        SELECT uid FROM HopThuoc
        WHERE don_vi_hien_tai_id = $1
          AND lo_thuoc_id = $2
          AND trang_thai = 'TrongKho'
        LIMIT $3
    `;
    const result = await pool.query(query, [don_vi_id, lo_thuoc_id, so_luong]);
    return result.rows.map(r => r.uid);
};

export {
    callTransferProcedure,
    disposeMedicine,
    returnMedicine,
    recallBatch,
    getAllUnits,
    getProductsInUnit,
    getBatchesInUnit,
    getUIDsForTransfer,
};