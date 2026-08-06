import pool from '../../config/db.js';

const callImportProcedure = async (duocPhamId, donViId, soLo, ngaySx, hsd, soLuong, quyCachId = null) => {
    // If quy_cach_id is not provided, default to the first packaging unit of the product (required for TonKho PK)
    let finalQuyCachId = quyCachId;
    if (!finalQuyCachId) {
        const qc = await pool.query(
            'SELECT id FROM QuyCachDongGoi WHERE duoc_pham_id = $1 ORDER BY id ASC LIMIT 1',
            [duocPhamId]
        );
        if (!qc.rows.length) {
            const err = new Error(`Thuốc ID ${duocPhamId} chưa có quy cách đóng gói. Vui lòng thêm quy cách trước khi nhập kho.`);
            err.statusCode = 400;
            throw err;
        }
        finalQuyCachId = qc.rows[0].id;
    }

    // Step 1: Create a new LoThuoc record
    const insertLo = await pool.query(
        `INSERT INTO LoThuoc (duoc_pham_id, quy_cach_id, so_lo, ngay_san_xuat, han_su_dung)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, so_lo, ngay_san_xuat, han_su_dung, trang_thai`,
        [duocPhamId, finalQuyCachId, soLo, ngaySx, hsd]
    );
    const loThuoc = insertLo.rows[0];

    // Step 2: Call stored procedure to generate HopThuoc (UID) and update TonKho
    await pool.query(
        `CALL sp_nhap_kho_lo_thuoc_moi($1::INT, $2::INT, $3::INT)`,
        [loThuoc.id, donViId, soLuong]
    );

    return loThuoc;
};

const checkInventory = async (donViId, duocPhamId) => {
    const query = `
        SELECT so_luong_ton FROM TonKho 
        WHERE don_vi_id = $1 AND duoc_pham_id = $2;
    `;
    const result = await pool.query(query, [donViId, duocPhamId]);
    return result.rows[0];
};

const getTotalProductStock = async (duocPhamId) => {
    const query = `
        SELECT COALESCE(SUM(so_luong_ton), 0) AS total_stock 
        FROM TonKho 
        WHERE duoc_pham_id = $1;
    `;
    const result = await pool.query(query, [duocPhamId]);
    return parseInt(result.rows[0]?.total_stock || 0);
};

/**
 * @deprecated THIS FUNCTION IS DEPRECATED.
 * Do NOT use this function to deduct stock anymore. 
 * Inventory deduction is now automatically handled by the database trigger `trg_tru_ton_kho` 
 * when an order item is inserted into `ChiTietDonHang`.
 */
const deductStock = async (duocPhamId, baseQuantity) => {
    // Get units with stock for this product, descending so we take from the biggest source first (or ascending if we want to clear small batches)
    const query = `
        SELECT don_vi_id, so_luong_ton 
        FROM TonKho 
        WHERE duoc_pham_id = $1 AND so_luong_ton > 0
        ORDER BY so_luong_ton DESC;
    `;
    const result = await pool.query(query, [duocPhamId]);
    const units = result.rows;
    
    let remaining = baseQuantity;
    for (const unit of units) {
        if (remaining <= 0) break;
        
        const deductAmount = Math.min(unit.so_luong_ton, remaining);
        await pool.query(
            'UPDATE TonKho SET so_luong_ton = so_luong_ton - $3, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE don_vi_id = $1 AND duoc_pham_id = $2',
            [unit.don_vi_id, duocPhamId, deductAmount]
        );
        remaining -= deductAmount;
    }
    
    if (remaining > 0) {
        // Technically this shouldn't happen if we checked before
        throw new Error(`Insufficient stock for product ID ${duocPhamId}. Still need ${remaining} units.`);
    }
    
    return true;
};

export { callImportProcedure, checkInventory, getTotalProductStock, deductStock };