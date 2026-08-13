import prisma, { serializeBigInt } from '../../config/prisma.js';

// 1. Get all categories
const getAllCategories = async () => {
    return await prisma.danhmuc.findMany({
        where: { trang_thai: true },
        select: {
            id: true,
            ten_danh_muc: true,
            hinh_anh_icon: true,
            danh_muc_cha_id: true
        },
        orderBy: [
            { thu_tu_hien_thi: 'asc' },
            { ten_danh_muc: 'asc' }
        ]
    });
};

// 2. Get products (List)
const getProducts = async (categoryId, search, sort, limit, offset, userId = null, isFlashSale = false, inStock = false) => {
    let orderBy = 'dp.id DESC';
    if (sort === 'price_asc') orderBy = 'qc.gia_ban ASC NULLS LAST';
    if (sort === 'price_desc') orderBy = 'qc.gia_ban DESC NULLS LAST';
    if (sort === 'best_selling') orderBy = 'dp.so_luong_da_ban DESC NULLS LAST';

    let catIds = [];
    if (Array.isArray(categoryId)) {
        catIds = categoryId.map(id => parseInt(id)).filter(id => !isNaN(id));
    } else if (typeof categoryId === 'string' && categoryId.trim()) {
        catIds = categoryId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else if (typeof categoryId === 'number' && !isNaN(categoryId)) {
        catIds = [categoryId];
    }

    const hasCatFilter = catIds.length > 0;

    const query = `
        SELECT dp.id, dp.ten_thuoc, dp.slug, dp.hinh_anh_url, dp.la_thuoc_ke_don, 
                dp.mo_ta_ngan, dp.so_luong_da_ban, dp.diem_danh_gia,
                qc.gia_ban, qc.gia_goc, qc.phan_tram_giam, qc.ten_don_vi AS don_vi_ban,
                (SELECT COALESCE(MAX(tk.so_luong_ton), 0) FROM TonKho tk JOIN DonVi dv_tk ON tk.don_vi_id = dv_tk.id WHERE tk.duoc_pham_id = dp.id AND dv_tk.loai_don_vi = 'NhaThuoc') AS total_stock,
                (SELECT EXISTS(SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $5 AND duoc_pham_id = dp.id)) AS is_favorited
        FROM DuocPham dp
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id 
        WHERE (${!hasCatFilter} OR dp.danh_muc_id IN (
            SELECT id FROM DanhMuc WHERE id = ANY($1::INT[]) OR danh_muc_cha_id = ANY($1::INT[])
        ))
            AND ($2::VARCHAR IS NULL OR dp.ten_thuoc ILIKE '%' || $2 || '%')
            AND dp.trang_thai = TRUE
            AND ($6::BOOLEAN IS FALSE OR (SELECT COALESCE(MAX(tk.so_luong_ton), 0) FROM TonKho tk JOIN DonVi dv_tk ON tk.don_vi_id = dv_tk.id WHERE tk.duoc_pham_id = dp.id AND dv_tk.loai_don_vi = 'NhaThuoc') > 0)
            ${isFlashSale ? `AND qc.phan_tram_giam > 0 AND CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' BETWEEN qc.thoi_gian_bat_dau_sale AND qc.thoi_gian_ket_thuc_sale` : ''}
        ORDER BY ${orderBy}
        LIMIT $3 OFFSET $4;
    `;
    const result = await prisma.$queryRawUnsafe(query, hasCatFilter ? catIds : [0], search, limit, offset, userId, inStock);
    return serializeBigInt(result);
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
               (SELECT COALESCE(MAX(tk.so_luong_ton), 0) FROM TonKho tk JOIN DonVi dv_tk ON tk.don_vi_id = dv_tk.id WHERE tk.duoc_pham_id = dp.id AND dv_tk.loai_don_vi = 'NhaThuoc') AS total_stock,
               (SELECT EXISTS(SELECT 1 FROM SanPhamYeuThich WHERE khach_hang_id = $2 AND duoc_pham_id = dp.id)) AS is_favorited
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        LEFT JOIN DonVi dv ON dp.don_vi_san_xuat_id = dv.id
        WHERE ${condition} AND dp.trang_thai = TRUE;
    `;
    const productResult = await prisma.$queryRawUnsafe(productQuery, identifier, userId);
    const product = productResult[0];

    if (!product) return null;

    const variants = await prisma.quycachdonggoi.findMany({
        where: { duoc_pham_id: product.id },
        select: {
            id: true,
            ten_don_vi: true,
            gia_ban: true,
            gia_goc: true,
            phan_tram_giam: true
        },
        orderBy: { id: 'asc' }
    });

    product.quy_cach_dong_goi = variants.map(v => ({
        quy_cach_id: v.id,
        ten_don_vi: v.ten_don_vi,
        gia_ban: v.gia_ban,
        gia_goc: v.gia_goc,
        phan_tram_giam: v.phan_tram_giam
    }));
    
    return serializeBigInt(product);
};

const getNearestPharmacy = async (productId, lat, lng, quantity = 1) => {
    const query = `
        SELECT dv.id as don_vi_id, dv.ten_don_vi as ten_nha_thuoc, 
               dv.dia_chi, 
               fn_tinh_khoang_cach_km($1, $2, dv.toa_do_lat, dv.toa_do_lng) AS khoang_cach
        FROM DonVi dv
        JOIN TonKho tk ON dv.id = tk.don_vi_id
        WHERE dv.loai_don_vi = 'NhaThuoc' 
          AND tk.duoc_pham_id = $3 
          AND tk.so_luong_ton >= $4
        ORDER BY khoang_cach ASC LIMIT 1
    `;
    const result = await prisma.$queryRawUnsafe(query, lat, lng, productId, quantity);
    return serializeBigInt(result[0] || null);
};

const getUniqueBrands = async () => {
    const result = await prisma.$queryRaw`
        SELECT DISTINCT dv.ten_don_vi 
        FROM DonVi dv
        JOIN DuocPham dp ON dv.id = dp.don_vi_san_xuat_id
        WHERE dp.trang_thai = TRUE
        ORDER BY dv.ten_don_vi ASC;
    `;
    return result.map(r => r.ten_don_vi);
};

export const findStoreWithAllItems = async (items) => {
    if (!items || items.length === 0) return null;

    const consolidated = items.reduce((acc, item) => {
        acc[item.duoc_pham_id] = (acc[item.duoc_pham_id] || 0) + item.so_luong;
        return acc;
    }, {});

    const uniqueItems = Object.entries(consolidated).map(([id, qty]) => ({
        duoc_pham_id: parseInt(id),
        so_luong: qty
    }));

    const conditions = uniqueItems.map((_, i) => 
        `(SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE don_vi_id = dv.id AND duoc_pham_id = $${i * 2 + 1}) >= $${i * 2 + 2}`
    ).join(' AND ');

    const params = uniqueItems.flatMap(item => [item.duoc_pham_id, item.so_luong]);

    const query = `
        SELECT dv.id as don_vi_id, dv.ten_don_vi, dv.dia_chi
        FROM DonVi dv
        WHERE dv.loai_don_vi = 'NhaThuoc'
          AND ${conditions}
        LIMIT 1
    `;
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result[0] || null);
};

export { getAllCategories, getProducts, getProductByIdOrSlug, getNearestPharmacy, getUniqueBrands };