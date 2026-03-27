import * as adminProductModel from '../../models/admin/adminProductModel.js';

const addProduct = async (payload) => {
    const { thong_tin_thuoc, quy_cach_dong_goi } = payload;

    // Validate input data
    if (!thong_tin_thuoc || !quy_cach_dong_goi || quy_cach_dong_goi.length === 0) {
        const error = new Error('Dữ liệu không hợp lệ. Phải có thông tin thuốc và ít nhất 1 quy cách đóng gói.');
        error.statusCode = 400;
        throw error;
    }

    // Ensure there is at least one base unit
    const hasBaseUnit = quy_cach_dong_goi.some(v => v.la_don_vi_co_ban === true);
    if (!hasBaseUnit) {
        const error = new Error('At least one packaging unit must be marked as the base unit (la_don_vi_co_ban = true).');
        error.statusCode = 400;
        throw error;
    }

    const newId = await adminProductModel.createNewProduct(thong_tin_thuoc, quy_cach_dong_goi);
    return newId;
};

const removeProduct = async (id) => {
    const isDeleted = await adminProductModel.softDeleteProduct(id);
    if (!isDeleted) {
        const error = new Error('Product not found or already deleted!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

const fetchAdminProducts = async () => {
    return await adminProductModel.getAllAdminProducts();
};

const fetchAdminProductById = async (id) => {
    const product = await adminProductModel.getAdminProductDetail(id);
    if (!product) {
        const error = new Error('Product not found!');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

const editProduct = async (id, payload) => {
    const { thong_tin_thuoc, quy_cach_dong_goi } = payload;

    if (!thong_tin_thuoc || !quy_cach_dong_goi || quy_cach_dong_goi.length === 0) {
        const error = new Error('Missing drug information or packaging configurations!');
        error.statusCode = 400;
        throw error;
    }

    const hasBaseUnit = quy_cach_dong_goi.some(v => v.la_don_vi_co_ban === true);
    if (!hasBaseUnit) {
        const error = new Error('At least one packaging unit must be marked as the base unit (la_don_vi_co_ban = true).');
        error.statusCode = 400;
        throw error;
    }

    try {
        await adminProductModel.updateProductDb(id, thong_tin_thuoc, quy_cach_dong_goi);
        return true;
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            const err = new Error('Product not found!');
            err.statusCode = 404;
            throw err;
        }
        throw error;
    }
};

export { addProduct, removeProduct, fetchAdminProducts, fetchAdminProductById, editProduct };