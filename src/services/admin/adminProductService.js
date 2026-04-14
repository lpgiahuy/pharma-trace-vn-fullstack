import * as adminProductModel from '../../models/admin/adminProductModel.js';

const addProduct = async (payload) => {
    const { thong_tin_thuoc, quy_cach_dong_goi } = payload;

    // Validate input data basic
    if (!thong_tin_thuoc || !quy_cach_dong_goi || quy_cach_dong_goi.length === 0) {
        const error = new Error('Dữ liệu không hợp lệ. Phải có thông tin thuốc và ít nhất 1 quy cách đóng gói.');
        error.statusCode = 400;
        throw error;
    }

    // [NEW] Validate chi_tiet_thuoc phải là JSON Object chuẩn
    if (thong_tin_thuoc.chi_tiet_thuoc && (typeof thong_tin_thuoc.chi_tiet_thuoc !== 'object' || Array.isArray(thong_tin_thuoc.chi_tiet_thuoc))) {
        const error = new Error('Trường chi_tiet_thuoc phải là một định dạng JSON Object hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    // Validate mỗi quy cách phải có ten_don_vi và gia_ban
    const isValidVariants = quy_cach_dong_goi.every(v => v.ten_don_vi && v.gia_ban > 0);
    if (!isValidVariants) {
        const error = new Error('Mỗi quy cách đóng gói phải có tên đơn vị và giá bán hợp lệ.');
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
        const error = new Error('Thiếu thông tin thuốc hoặc quy cách đóng gói!');
        error.statusCode = 400;
        throw error;
    }

    // [NEW] Validate chi_tiet_thuoc phải là JSON Object chuẩn
    if (thong_tin_thuoc.chi_tiet_thuoc && (typeof thong_tin_thuoc.chi_tiet_thuoc !== 'object' || Array.isArray(thong_tin_thuoc.chi_tiet_thuoc))) {
        const error = new Error('Trường chi_tiet_thuoc phải là một định dạng JSON Object hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const isValidVariants = quy_cach_dong_goi.every(v => v.ten_don_vi && v.gia_ban > 0);
    if (!isValidVariants) {
        const error = new Error('Mỗi quy cách đóng gói phải có tên đơn vị và giá bán hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    try {
        await adminProductModel.updateProductDb(id, thong_tin_thuoc, quy_cach_dong_goi);
        return true;
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            const err = new Error('Không tìm thấy sản phẩm!');
            err.statusCode = 404;
            throw err;
        }
        throw error;
    }
};

export { addProduct, removeProduct, fetchAdminProducts, fetchAdminProductById, editProduct };