import pool from '../../config/db.js';

// Lấy danh sách toa thuốc (Có thể lọc theo trạng thái: ChoDuyet, HopLe, TuChoi)
export const getPrescriptions = async (status) => {
    let query = `
        SELECT t.id, t.hinh_anh_toa, t.ten_bac_si, t.ten_benh_vien, t.chuan_doan, t.ngay_tao, t.trang_thai_duyet,
               k.ho_ten AS ten_khach_hang, k.so_dien_thoai
        FROM ToaThuoc t
        JOIN KhachHang k ON t.khach_hang_id = k.id
    `;
    const params = [];
    
    // Nếu có truyền status vào thì lọc, không thì lấy hết
    if (status) {
        query += ` WHERE t.trang_thai_duyet = $1`;
        params.push(status);
    }
    query += ` ORDER BY t.ngay_tao DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
};

// Dược sĩ cập nhật trạng thái toa thuốc
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