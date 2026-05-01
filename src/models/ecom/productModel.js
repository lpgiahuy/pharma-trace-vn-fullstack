import pool from '../../config/db.js';

// 1. Get all categories
const getAllCategories = async () => {
    const query = `
        SELECT id, ten_danh_muc, hinh_anh_icon, danh_muc_cha_id 
        FROM DanhMuc 
        WHERE trang_thai = TRUE
        ORDER BY thu_tu_hien_thi ASC, ten_danh_muc ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Get products (List)
const getProducts = async (categoryId, search, sort, limit, offset, userId = null, isFlashSale = false, inStock = false) => {
    let orderBy = 'dp.id DESC';
    if (sort === 'price_asc') orderBy = 'qc.gia_ban ASC NULLS LAST';
    if (sort === 'price_desc') orderBy = 'qc.gia_ban DESC NULLS LAST';
    if (sort === 'best_selling') orderBy = 'dp.so_luong_da_ban DESC NULLS LAST';

    const query = `
        SELECT dp.id, dp.ten_thuoc, dp.slug, dp.hinh_anh_url, dp.la_thuoc_ke_don, 
                dp.mo_ta_ngan, dp.so_luong_da_ban, dp.diem_danh_gia,
                qc.gia_ban, qc.gia_goc, qc.phan_tram_giam, qc.ten_don_vi AS don_vi_ban,
                (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) AS total_stock,
                (SELECT EXISTS(SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $5 AND duoc_pham_id = dp.id)) AS is_favorited
        FROM DuocPham dp
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id 
        WHERE ($1::INT IS NULL OR dp.danh_muc_id = $1)
            AND ($2::VARCHAR IS NULL OR dp.ten_thuoc ILIKE '%' || $2 || '%')
            AND dp.trang_thai = TRUE
            AND ($6::BOOLEAN IS FALSE OR (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) > 0)
            ${isFlashSale ? `AND qc.phan_tram_giam > 0 AND CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' BETWEEN qc.thoi_gian_bat_dau_sale AND qc.thoi_gian_ket_thuc_sale` : ''}
        ORDER BY ${orderBy}
        LIMIT $3 OFFSET $4;
    `;
    const result = await pool.query(query, [categoryId, search, limit, offset, userId, inStock]);
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
        SELECT id AS quy_cach_id, ten_don_vi, gia_ban, gia_goc, phan_tram_giam
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
        SELECT dv.id as don_vi_id, dv.ten_don_vi as ten_nha_thuoc, 
               dv.dia_chi, 
               fn_tinh_khoang_cach_km($1, $2, dv.toa_do_lat, dv.toa_do_lng) AS khoang_cach
        FROM DonVi dv
        JOIN TonKho tk ON dv.id = tk.don_vi_id
        WHERE dv.loai_don_vi = 'NhaThuoc' 
          AND tk.duoc_pham_id = $3 
          AND tk.so_luong_ton > 0
        ORDER BY khoang_cach ASC LIMIT 1
    `;
    // Lưu ý: Thứ tự tham số trong SQL là (lat, lng, productId)
    const result = await pool.query(query, [lat, lng, productId]);

    // Trả về nhà thuốc gần nhất nếu có, hoặc null nếu không tìm thấy
    return result.rows[0] || null;
};

const getUniqueBrands = async () => {
    const query = `
        SELECT DISTINCT dv.ten_don_vi 
        FROM DonVi dv
        JOIN DuocPham dp ON dv.id = dp.don_vi_san_xuat_id
        WHERE dp.trang_thai = TRUE
        ORDER BY dv.ten_don_vi ASC;
    `;
    const result = await pool.query(query);
    return result.rows.map(r => r.ten_don_vi);
};

export { getAllCategories, getProducts, getProductByIdOrSlug, getNearestPharmacy, getUniqueBrands };