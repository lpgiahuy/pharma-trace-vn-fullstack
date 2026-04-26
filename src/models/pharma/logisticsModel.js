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
    // Ép kiểu mảng thành chuỗi chuẩn của Postgres
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

export { 
    callTransferProcedure, 
    disposeMedicine, 
    returnMedicine, 
    recallBatch, 
    getAllUnits 
};