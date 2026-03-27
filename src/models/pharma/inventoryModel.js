import pool from '../../config/db.js';

const callImportProcedure = async (duocPhamId, donViId, soLo, ngaySx, hsd, soLuong) => {
    // auto insert LoThuoc, auto insert HopThuoc (sinh UUID), auto update TonKho.
    const query = `CALL sp_nhap_kho_lo_thuoc_moi($1, $2, $3, $4, $5, $6)`;
    
    await pool.query(query, [duocPhamId, donViId, soLo, ngaySx, hsd, soLuong]);
    
    // after the procedure, fetch the newly created batch info to return to client
    const fetchQuery = `
        SELECT id, so_lo, ngay_san_xuat, han_su_dung, trang_thai 
        FROM LoThuoc 
        WHERE so_lo = $1 
        ORDER BY id DESC LIMIT 1;
    `;
    const result = await pool.query(fetchQuery, [soLo]);
    return result.rows[0];
};

const checkInventory = async (donViId, duocPhamId) => {
    const query = `
        SELECT so_luong_ton FROM TonKho 
        WHERE don_vi_id = $1 AND duoc_pham_id = $2;
    `;
    const result = await pool.query(query, [donViId, duocPhamId]);
    return result.rows[0];
};

export { callImportProcedure, checkInventory };