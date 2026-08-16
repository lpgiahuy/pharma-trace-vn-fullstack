import prisma, { serializeBigInt } from '../../config/prisma.js';
import { generateSlug } from '../../utils/slugHelper.js';

const createNewProduct = async (productData, variantsData) => {
    return await prisma.$transaction(async (tx) => {
        const slug = generateSlug(productData.ten_thuoc) + '-' + Date.now();

        const product = await tx.duocpham.create({
            data: {
                ten_thuoc: productData.ten_thuoc,
                slug,
                so_dang_ky: productData.so_dang_ky,
                danh_muc_id: productData.danh_muc_id,
                don_vi_san_xuat_id: productData.don_vi_san_xuat_id,
                hinh_anh_url: productData.hinh_anh_url,
                la_thuoc_ke_don: productData.la_thuoc_ke_don,
                mo_ta_ngan: productData.mo_ta_ngan,
                chi_tiet_thuoc: productData.chi_tiet_thuoc
            }
        });

        if (variantsData && variantsData.length > 0) {
            await tx.quycachdonggoi.createMany({
                data: variantsData.map(v => {
                    const giaBan = Number(v.gia_ban) || 0;
                    const giaGoc = v.gia_goc ? Number(v.gia_goc) : null;
                    let pct = v.phan_tram_giam ? Number(v.phan_tram_giam) : 0;
                    if (giaGoc && giaGoc > giaBan && (!pct || pct === 0)) {
                        pct = Math.max(0, Math.round(((giaGoc - giaBan) / giaGoc) * 100));
                    }
                    return {
                        duoc_pham_id: product.id,
                        ten_don_vi: v.ten_don_vi,
                        gia_ban: giaBan,
                        gia_goc: giaGoc,
                        phan_tram_giam: pct,
                        thoi_gian_bat_dau_sale: v.thoi_gian_bat_dau_sale ? new Date(v.thoi_gian_bat_dau_sale) : null,
                        thoi_gian_ket_thuc_sale: v.thoi_gian_ket_thuc_sale ? new Date(v.thoi_gian_ket_thuc_sale) : null,
                    };
                })
            });
        }

        return product.id;
    });
};

const softDeleteProduct = async (id) => {
    const updated = await prisma.duocpham.update({
        where: { id: Number(id) },
        data: { trang_thai: false }
    });
    return !!updated;
};

const hardDeleteProduct = async (id) => {
    const deleted = await prisma.duocpham.delete({
        where: { id: Number(id) }
    });
    return !!deleted;
};

const toggleProductStatus = async (id) => {
    const productId = Number(id);
    const product = await prisma.duocpham.findUnique({
        where: { id: productId },
        select: { trang_thai: true }
    });
    if (!product) return null;

    return await prisma.duocpham.update({
        where: { id: productId },
        data: {
            trang_thai: !product.trang_thai,
            ngay_cap_nhat_moi: new Date()
        },
        select: {
            id: true,
            trang_thai: true
        }
    });
};

const getAllAdminProducts = async (filters = {}) => {
    const { search, sort, don_vi_id, is_super_admin } = filters;
    const params = [];

    let stockSubquery;
    if (is_super_admin) {
        // SuperAdmin: sum stock across ALL internal PharmaTrace units
        stockSubquery = `SELECT COALESCE(SUM(tk2.so_luong_ton), 0) FROM TonKho tk2 JOIN DonVi dv2 ON tk2.don_vi_id = dv2.id WHERE tk2.duoc_pham_id = dp.id AND dv2.la_don_vi_noi_bo = TRUE`;
    } else if (don_vi_id) {
        params.push(Number(don_vi_id));
        stockSubquery = `SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id AND don_vi_id = $${params.length}`;
    } else {
        stockSubquery = `SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id`;
    }

    let query = `
        WITH DistinctProducts AS (
            SELECT DISTINCT ON (dp.id)
                   dp.id, dp.ten_thuoc, dp.so_dang_ky, dp.hinh_anh_url, dp.trang_thai, dm.ten_danh_muc,
                   qc.gia_ban AS price,
                   (${stockSubquery}) AS total_stock
            FROM DuocPham dp
            LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
            LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id
            WHERE 1=1
    `;

    if (search) {
        params.push(search);
        query += ` AND (
            dp.id::TEXT = $${params.length} OR 
            dp.ten_thuoc ILIKE '%' || $${params.length} || '%' OR 
            dp.so_dang_ky ILIKE '%' || $${params.length} || '%'
        )`;
    }

    query += `
            ORDER BY dp.id, qc.id ASC
        )
        SELECT * FROM DistinctProducts
    `;

    // Handle sorting
    switch (sort) {
        case 'price_asc':  query += ` ORDER BY price ASC`; break;
        case 'price_desc': query += ` ORDER BY price DESC`; break;
        case 'name_asc':   query += ` ORDER BY ten_thuoc ASC`; break;
        case 'name_desc':  query += ` ORDER BY ten_thuoc DESC`; break;
        case 'oldest':     query += ` ORDER BY id ASC`; break;
        case 'newest':     
        default:           query += ` ORDER BY id DESC`; break;
    }

    const result = await prisma.$queryRawUnsafe(query, ...params);
    return serializeBigInt(result);
};

// get product detail by ID for admin view (includes all variants and even if hidden)
const getAdminProductDetail = async (id) => {
    const product = await prisma.duocpham.findUnique({
        where: { id: Number(id) }
    });
    if (!product) return null;

    const variants = await prisma.quycachdonggoi.findMany({
        where: { duoc_pham_id: product.id },
        orderBy: { id: 'asc' }
    });

    product.quy_cach_dong_goi = variants;
    return serializeBigInt(product);
};

// update product (using transaction to ensure atomicity when updating both product and variants)
const updateProductDb = async (id, productData, variantsData) => {
    const productId = Number(id);
    return await prisma.$transaction(async (tx) => {
        const newSlug = generateSlug(productData.ten_thuoc) + '-' + Date.now();

        const updated = await tx.duocpham.update({
            where: { id: productId },
            data: {
                ten_thuoc: productData.ten_thuoc,
                slug: newSlug,
                so_dang_ky: productData.so_dang_ky,
                danh_muc_id: productData.danh_muc_id,
                don_vi_san_xuat_id: productData.don_vi_san_xuat_id,
                hinh_anh_url: productData.hinh_anh_url,
                la_thuoc_ke_don: productData.la_thuoc_ke_don,
                mo_ta_ngan: productData.mo_ta_ngan,
                chi_tiet_thuoc: productData.chi_tiet_thuoc,
                trang_thai: productData.trang_thai !== undefined ? productData.trang_thai : undefined,
                ngay_cap_nhat_moi: new Date()
            }
        });
        if (!updated) throw new Error('NOT_FOUND');

        // clear old variants and re-insert
        await tx.quycachdonggoi.deleteMany({
            where: { duoc_pham_id: productId }
        });

        if (variantsData && variantsData.length > 0) {
            await tx.quycachdonggoi.createMany({
                data: variantsData.map(v => {
                    const giaBan = Number(v.gia_ban) || 0;
                    const giaGoc = v.gia_goc ? Number(v.gia_goc) : null;
                    let pct = v.phan_tram_giam ? Number(v.phan_tram_giam) : 0;
                    if (giaGoc && giaGoc > giaBan && (!pct || pct === 0)) {
                        pct = Math.max(0, Math.round(((giaGoc - giaBan) / giaGoc) * 100));
                    }
                    return {
                        duoc_pham_id: productId,
                        ten_don_vi: v.ten_don_vi,
                        gia_ban: giaBan,
                        gia_goc: giaGoc,
                        phan_tram_giam: pct,
                        thoi_gian_bat_dau_sale: v.thoi_gian_bat_dau_sale ? new Date(v.thoi_gian_bat_dau_sale) : null,
                        thoi_gian_ket_thuc_sale: v.thoi_gian_ket_thuc_sale ? new Date(v.thoi_gian_ket_thuc_sale) : null,
                    };
                })
            });
        }

        return true;
    });
};

export { 
    createNewProduct, 
    softDeleteProduct, 
    hardDeleteProduct,
    toggleProductStatus,
    getAllAdminProducts, 
    getAdminProductDetail, 
    updateProductDb 
};