import pool from '../../config/db.js';

// get all categories
const getAllCategories = async () => {
    const query = `
        SELECT id, ten_danh_muc, hinh_anh_icon 
        FROM DanhMuc 
        ORDER BY thu_tu_hien_thi ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// get products with optional filters: categoryId, search keyword, pagination (limit, offset)
const getProducts = async (categoryId, search, limit, offset) => {
    const query = `
        SELECT dp.id, dp.ten_thuoc, dp.hinh_anh_url, dp.la_thuoc_ke_don, dp.mo_ta_ngan,
               qc.gia_ban, qc.ten_don_vi AS don_vi_ban
        FROM DuocPham dp
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id AND qc.la_don_vi_co_ban = TRUE
        WHERE ($1::INT IS NULL OR dp.danh_muc_id = $1)
          AND ($2::VARCHAR IS NULL OR dp.ten_thuoc ILIKE '%' || $2 || '%')
        ORDER BY dp.id DESC
        LIMIT $3 OFFSET $4;
    `;
    const result = await pool.query(query, [categoryId, search, limit, offset]);
    return result.rows;
};

// get product detail by id
const getProductById = async (id) => {
    const productQuery = `
        SELECT dp.id, dp.ten_thuoc, dp.so_dang_ky, dp.hinh_anh_url, dp.la_thuoc_ke_don, 
               dp.mo_ta_ngan, dp.chi_tiet_thuoc, dm.ten_danh_muc, dv.ten_don_vi AS nha_san_xuat
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        LEFT JOIN DonVi dv ON dp.don_vi_san_xuat_id = dv.id
        WHERE dp.id = $1;
    `;
    const productResult = await pool.query(productQuery, [id]);
    const product = productResult.rows[0];

    if (!product) return null;

    // get all variants for this product, ordered by conversion factor (he_so_quy_doi) ascending
    const variantQuery = `
        SELECT id AS quy_cach_id, ten_don_vi, he_so_quy_doi, gia_ban, la_don_vi_co_ban
        FROM QuyCachDongGoi
        WHERE duoc_pham_id = $1
        ORDER BY he_so_quy_doi ASC;
    `;
    const variantResult = await pool.query(variantQuery, [id]);
    
    product.quy_cach_dong_goi = variantResult.rows;
    return product;
};

export { getAllCategories, getProducts, getProductById };