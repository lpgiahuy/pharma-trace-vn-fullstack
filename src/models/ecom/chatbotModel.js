import pool from '../../config/db.js';

// keywords: mảng từ khóa, mỗi từ là một điều kiện OR riêng
const searchProductsForContext = async (keywords) => {
    if (!keywords || keywords.length === 0) return [];

    // Mỗi keyword tạo ra 1 nhóm điều kiện ILIKE
    const conditions = keywords
        .map((_, i) => `(
            dp.ten_thuoc ILIKE $${i + 1}
            OR dp.mo_ta_ngan ILIKE $${i + 1}
            OR dp.chi_tiet_thuoc::text ILIKE $${i + 1}
            OR dm.ten_danh_muc ILIKE $${i + 1}
        )`)
        .join(' OR ');

    const params = keywords.map(k => `%${k}%`);

    const query = `
        SELECT
            dp.id,
            dp.ten_thuoc,
            dp.slug,
            dp.la_thuoc_ke_don,
            dp.mo_ta_ngan,
            dp.chi_tiet_thuoc,
            dp.diem_danh_gia,
            dp.so_luong_da_ban,
            dm.ten_danh_muc,
            dv.ten_don_vi AS nha_san_xuat,
            MIN(qc.gia_ban) AS gia_ban_thap_nhat
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        LEFT JOIN DonVi dv ON dp.don_vi_san_xuat_id = dv.id
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id
        WHERE dp.trang_thai = TRUE AND (${conditions})
        GROUP BY dp.id, dp.ten_thuoc, dp.slug, dp.la_thuoc_ke_don,
                 dp.mo_ta_ngan, dp.chi_tiet_thuoc, dp.diem_danh_gia,
                 dp.so_luong_da_ban, dm.ten_danh_muc, dv.ten_don_vi
        ORDER BY dp.so_luong_da_ban DESC
        LIMIT 5;
    `;

    const result = await pool.query(query, params);
    return result.rows;
};

export { searchProductsForContext };
