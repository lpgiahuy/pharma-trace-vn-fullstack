import pool from '../../config/db.js';
import { generateSlug } from '../../utils/slugHelper.js';

const createNewProduct = async (productData, variantsData) => {
    // create new client to run transaction (ensure integrity)
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // start transaction

        // Generate unique slug by appending timestamp
        const slug = generateSlug(productData.ten_thuoc) + '-' + Date.now();

        // add product (Note: chi_tiet_thuoc is passed directly as an Object, pg library will auto-parse to JSONB)
        const productQuery = `
            INSERT INTO DuocPham (ten_thuoc, slug, so_dang_ky, danh_muc_id, don_vi_san_xuat_id, hinh_anh_url, la_thuoc_ke_don, mo_ta_ngan, chi_tiet_thuoc)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        `;
        const pValues = [
            productData.ten_thuoc, slug, productData.so_dang_ky, productData.danh_muc_id,
            productData.don_vi_san_xuat_id, productData.hinh_anh_url,
            productData.la_thuoc_ke_don, productData.mo_ta_ngan, productData.chi_tiet_thuoc
        ];
        const productResult = await client.query(productQuery, pValues);
        const newProductId = productResult.rows[0].id;

        // add variants (quy_cach_dong_goi) 
        const variantQuery = `
            INSERT INTO QuyCachDongGoi (duoc_pham_id, ten_don_vi, gia_ban)
            VALUES ($1, $2, $3);
        `;
        for (const variant of variantsData) {
            await client.query(variantQuery, [
                newProductId, variant.ten_don_vi, variant.gia_ban
            ]);
        }

        await client.query('COMMIT'); // store permanent in DB
        return newProductId;

    } catch (error) {
        await client.query('ROLLBACK'); // if fail, undo all changes
        throw error;
    } finally {
        client.release(); // return connection to pool
    }
};

const softDeleteProduct = async (id) => {
    // Soft delete by setting trang_thai to FALSE (hidden from public, but still in DB)
    const query = `UPDATE DuocPham SET trang_thai = FALSE WHERE id = $1 AND trang_thai = TRUE RETURNING id;`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0; // return true if a row was updated, false if not found or already deleted
};

// get all products for admin view (includes hidden/soft-deleted ones)
const getAllAdminProducts = async () => {
    const query = `
        SELECT dp.id, dp.ten_thuoc, dp.so_dang_ky, dp.hinh_anh_url, dp.trang_thai, dm.ten_danh_muc
        FROM DuocPham dp
        LEFT JOIN DanhMuc dm ON dp.danh_muc_id = dm.id
        ORDER BY dp.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// get product detail by ID for admin view (includes all variants and even if hidden)
const getAdminProductDetail = async (id) => {
    const pQuery = `SELECT * FROM DuocPham WHERE id = $1`;
    const pRes = await pool.query(pQuery, [id]);
    if (pRes.rowCount === 0) return null;

    const vQuery = `SELECT id, ten_don_vi, gia_ban FROM QuyCachDongGoi WHERE duoc_pham_id = $1 ORDER BY id ASC`;
    const vRes = await pool.query(vQuery, [id]);

    const product = pRes.rows[0];
    product.quy_cach_dong_goi = vRes.rows;
    return product;
};

// update product (using transaction to ensure atomicity when updating both product and variants)
const updateProductDb = async (id, productData, variantsData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Also update slug to string to match updated name (or leave it if you want fixed URLs)
        const newSlug = generateSlug(productData.ten_thuoc) + '-' + Date.now();

        const pQuery = `
            UPDATE DuocPham 
            SET ten_thuoc = $1, slug = $2, so_dang_ky = $3, danh_muc_id = $4, don_vi_san_xuat_id = $5,
                hinh_anh_url = $6, la_thuoc_ke_don = $7, mo_ta_ngan = $8, chi_tiet_thuoc = $9,
                trang_thai = COALESCE($10, trang_thai),
                ngay_cap_nhat_moi = CURRENT_TIMESTAMP
            WHERE id = $11 RETURNING id;
        `;
        const pValues = [
            productData.ten_thuoc, newSlug, productData.so_dang_ky, productData.danh_muc_id,
            productData.don_vi_san_xuat_id, productData.hinh_anh_url,
            productData.la_thuoc_ke_don, productData.mo_ta_ngan, productData.chi_tiet_thuoc,
            productData.trang_thai, id
        ];

        const pResult = await client.query(pQuery, pValues);
        if (pResult.rowCount === 0) throw new Error('NOT_FOUND');

        // clear old variants (delete all old ones, then re-insert new ones - simple approach)
        await client.query(`DELETE FROM QuyCachDongGoi WHERE duoc_pham_id = $1`, [id]);

        const vQuery = `
            INSERT INTO QuyCachDongGoi (duoc_pham_id, ten_don_vi, gia_ban)
            VALUES ($1, $2, $3);
        `;
        for (const v of variantsData) {
            await client.query(vQuery, [id, v.ten_don_vi, v.gia_ban]);
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export { createNewProduct, softDeleteProduct, getAllAdminProducts, getAdminProductDetail, updateProductDb };