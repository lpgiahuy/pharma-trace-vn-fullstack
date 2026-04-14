import pool from '../../config/db.js';

// 1. Get all categories
const getAllCategories = async () => {
    const query = `
        SELECT id, ten_danh_muc, hinh_anh_icon 
        FROM DanhMuc 
        WHERE trang_thai = TRUE
        ORDER BY thu_tu_hien_thi ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Get products (List)
const getProducts = async (categoryId, search, sort, limit, offset, userId = null) => {
    let orderBy = 'dp.id DESC';
    if (sort === 'price_asc') orderBy = 'qc.gia_ban ASC NULLS LAST';
    if (sort === 'price_desc') orderBy = 'qc.gia_ban DESC NULLS LAST';
    if (sort === 'best_selling') orderBy = 'dp.so_luong_da_ban DESC NULLS LAST';

    // ... (phần orderBy giữ nguyên)

    const query = `
        SELECT dp.id, dp.ten_thuoc, dp.slug, dp.hinh_anh_url, dp.la_thuoc_ke_don, 
                dp.mo_ta_ngan, dp.so_luong_da_ban, dp.diem_danh_gia,
                qc.gia_ban, qc.ten_don_vi AS don_vi_ban,
                (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) AS total_stock,
                (SELECT EXISTS(SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $5 AND duoc_pham_id = dp.id)) AS is_favorited
        FROM DuocPham dp
        -- SỬA Ở ĐÂY: Xóa điều kiện la_don_vi_co_ban
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id 
        WHERE ($1::INT IS NULL OR dp.danh_muc_id = $1)
            AND ($2::VARCHAR IS NULL OR dp.ten_thuoc ILIKE '%' || $2 || '%')
            AND dp.trang_thai = TRUE
        ORDER BY ${orderBy}
        LIMIT $3 OFFSET $4;
    `;
    const result = await pool.query(query, [categoryId, search, limit, offset, userId]);
    return result.rows;
};

// 3. Get product detail by ID or Slug
const getProductByIdOrSlug = async (identifier, userId = null) => {
    let condition = '';
    if (!isNaN(identifier) && !isNaN(parseInt(identifier))) {
        condition = 'dp.id = $1';
    } else {
        condition = 'dp.slug = $1';
    }

    const productQuery = `
        SELECT dp.id, dp.ten_thuoc, dp.slug, dp.so_dang_ky, dp.hinh_anh_url, dp.la_thuoc_ke_don, 
               dp.mo_ta_ngan, dp.chi_tiet_thuoc, dp.so_luong_da_ban, dp.diem_danh_gia,
               dm.ten_danh_muc, dv.ten_don_vi AS nha_san_xuat,
               (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) AS total_stock,
               (SELECT EXISTS(SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $2 AND duoc_pham_id = dp.id)) AS is_favorited
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        LEFT JOIN DonVi dv ON dp.don_vi_san_xuat_id = dv.id
        WHERE ${condition} AND dp.trang_thai = TRUE;
    `;
    const productResult = await pool.query(productQuery, [identifier, userId]);
    const product = productResult.rows[0];

    if (!product) return null;

    const variantQuery = `
        -- SỬA Ở ĐÂY: Chỉ lấy id, ten_don_vi và gia_ban
        SELECT id AS quy_cach_id, ten_don_vi, gia_ban
        FROM QuyCachDongGoi
        WHERE duoc_pham_id = $1
        ORDER BY id ASC; -- Sắp xếp theo ID cho ổn định
    `;
    const variantResult = await pool.query(variantQuery, [product.id]);

    product.quy_cach_dong_goi = variantResult.rows;
    return product;
};

const getNearestPharmacy = async (productId, lat, lng) => {
    const query = `
        SELECT ten_nha_thuoc, dia_chi, khoang_cach 
        FROM fn_find_nearest_pharmacy($1, $2, $3);
    `;
    // Lưu ý: Thứ tự tham số trong SQL là (lat, lng, productId)
    const result = await pool.query(query, [lat, lng, productId]);

    // Trả về nhà thuốc gần nhất nếu có, hoặc null nếu không tìm thấy
    return result.rows[0] || null;
};

export { getAllCategories, getProducts, getProductByIdOrSlug, getNearestPharmacy };