import pool from '../../config/db.js';

// Get list of prescriptions (optionally filtered by status: ChoDuyet, HopLe, TuChoi)
export const getPrescriptions = async (status) => {
    let query = `
        SELECT t.id, t.hinh_anh_toa, t.ten_bac_si, t.ten_benh_vien, t.chuan_doan, t.ngay_tao, t.trang_thai_duyet,
               k.ho_ten AS ten_khach_hang, k.so_dien_thoai
        FROM ToaThuoc t
        JOIN KhachHang k ON t.khach_hang_id = k.id
    `;
    const params = [];
    
    // Filter by status if provided, otherwise return all
    if (status) {
        query += ` WHERE t.trang_thai_duyet = $1`;
        params.push(status);
    }
    query += ` ORDER BY t.ngay_tao DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
};

// Pharmacist updates prescription approval status
export const updatePrescriptionStatus = async (id, trang_thai) => {
    const query = `
        UPDATE ToaThuoc
        SET trang_thai_duyet = $1
        WHERE id = $2
        RETURNING id, trang_thai_duyet;
    `;
    const result = await pool.query(query, [trang_thai, id]);
    return result.rows[0];
};