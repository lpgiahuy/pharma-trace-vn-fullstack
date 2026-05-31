import * as adminProductModel from '../../models/admin/adminProductModel.js';

const addProduct = async (payload) => {
    const { thong_tin_thuoc, quy_cach_dong_goi } = payload;

    // Validate input data basic
    if (!thong_tin_thuoc || !quy_cach_dong_goi || quy_cach_dong_goi.length === 0) {
        const error = new Error('Invalid data. Product info and at least 1 packaging unit are required.');
        error.statusCode = 400;
        throw error;
    }

    // [NEW] Validate that chi_tiet_thuoc is a proper JSON Object
    if (thong_tin_thuoc.chi_tiet_thuoc && (typeof thong_tin_thuoc.chi_tiet_thuoc !== 'object' || Array.isArray(thong_tin_thuoc.chi_tiet_thuoc))) {
        const error = new Error('The chi_tiet_thuoc field must be a valid JSON Object.');
        error.statusCode = 400;
        throw error;
    }

    // Each packaging variant must have a unit name and a positive price
    const isValidVariants = quy_cach_dong_goi.every(v => v.ten_don_vi && v.gia_ban > 0);
    if (!isValidVariants) {
        const error = new Error('Each packaging variant must have a unit name and a valid price.');
        error.statusCode = 400;
        throw error;
    }

    const newId = await adminProductModel.createNewProduct(thong_tin_thuoc, quy_cach_dong_goi);
    return newId;
};

const removeProduct = async (id) => {
    try {
        const isDeleted = await adminProductModel.hardDeleteProduct(id);
        if (!isDeleted) {
            const error = new Error('Product not found!');
            error.statusCode = 404;
            throw error;
        }
        return true;
    } catch (error) {
        if (error.code === '23503') { // Foreign key violation
            const err = new Error('Cannot delete this product because it has associated data (inventory, orders, etc.). Please hide it instead.');
            err.statusCode = 400;
            throw err;
        }
        throw error;
    }
};

const changeStatus = async (id) => {
    const product = await adminProductModel.toggleProductStatus(id);
    if (!product) {
        const error = new Error('Product not found!');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

const fetchAdminProducts = async (filters = {}) => {
    return await adminProductModel.getAllAdminProducts(filters);
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
        const error = new Error('Missing product info or packaging variants!');
        error.statusCode = 400;
        throw error;
    }

    // [NEW] Validate that chi_tiet_thuoc is a proper JSON Object
    if (thong_tin_thuoc.chi_tiet_thuoc && (typeof thong_tin_thuoc.chi_tiet_thuoc !== 'object' || Array.isArray(thong_tin_thuoc.chi_tiet_thuoc))) {
        const error = new Error('The chi_tiet_thuoc field must be a valid JSON Object.');
        error.statusCode = 400;
        throw error;
    }

    const isValidVariants = quy_cach_dong_goi.every(v => v.ten_don_vi && v.gia_ban > 0);
    if (!isValidVariants) {
        const error = new Error('Each packaging variant must have a unit name and a valid price.');
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

export { addProduct, removeProduct, changeStatus, fetchAdminProducts, fetchAdminProductById, editProduct };