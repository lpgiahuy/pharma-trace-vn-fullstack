import pool from '../../config/db.js';

export const callCheckoutProcedure = async (userId, dia_chi_giao, phuong_thuc_tt, ma_giam_gia, diem_su_dung, phi_ship, don_vi_xuat_id = null) => {
    const query = `CALL sp_tao_don_hang_tu_gio($1, $2, $3, $4, $5, $6, $7)`;
    await pool.query(query, [userId, dia_chi_giao, phuong_thuc_tt, ma_giam_gia, diem_su_dung, phi_ship, don_vi_xuat_id]);

    const result = await pool.query(
        `SELECT * FROM DonHang WHERE khach_hang_id = $1 ORDER BY ngay_dat_hang DESC LIMIT 1`,
        [userId]
    );
    return result.rows[0];
};

export const getShippingFee = async (distance) => {
    const res = await pool.query('SELECT fn_calculate_shipping_fee($1) as fee', [distance]);
    return parseFloat(res.rows[0].fee);
};

export const addLoyaltyPoints = async (userId, amount) => {
    const pointsToEarn = Math.floor(amount * 0.005); // Tích 0.5%
    const res = await pool.query(
        `UPDATE KhachHang SET diem_tich_luy = diem_tich_luy + $2 WHERE id = $1 RETURNING diem_tich_luy, hang_thanh_vien`,
        [userId, pointsToEarn]
    );
    return {
        pointsEarned: pointsToEarn,
        newTotalPoints: res.rows[0].diem_tich_luy,
        newTier: res.rows[0].hang_thanh_vien
    };
};

export const getOrdersByUserId = async (userId, limit = 10, offset = 0) => {
    const query = `
        SELECT dh.*, dh.trang_thai_don AS trang_thai,
        (SELECT COUNT(*) FROM ChiTietDonHang WHERE don_hang_id = dh.id) as items_count
        FROM DonHang dh WHERE khach_hang_id = $1 ORDER BY ngay_dat_hang DESC
        LIMIT $2 OFFSET $3`;
    const res = await pool.query(query, [userId, limit, offset]);
    return res.rows;
};

export const cancelOrder = async (orderId, userId) => {
    // Gọi Procedure: sẽ tự kiểm tra trạng thái 'ChoXacNhan' và throw nếu không hợp lệ
    await pool.query(`CALL sp_huy_don_hang_khach($1::INT, $2::INT)`, [orderId, userId]);
    return true;
};

export const getOrderDetailById = async (orderId, userId) => {
    const res = await pool.query(
        `SELECT dh.*, dh.trang_thai_don AS trang_thai, kh.ho_ten as khach_hang_ten 
         FROM DonHang dh JOIN KhachHang kh ON dh.khach_hang_id = kh.id WHERE dh.id = $1 AND dh.khach_hang_id = $2`,
        [orderId, userId]
    );
    const order = res.rows[0];
    if (!order) return null;

    const items = await pool.query(
        `SELECT ctdh.*, dp.ten_thuoc, qc.ten_don_vi FROM ChiTietDonHang ctdh 
         JOIN DuocPham dp ON ctdh.duoc_pham_id = dp.id JOIN QuyCachDongGoi qc ON ctdh.quy_cach_id = qc.id WHERE ctdh.don_hang_id = $1`,
        [orderId]
    );
    order.items = items.rows;
    return order;
};