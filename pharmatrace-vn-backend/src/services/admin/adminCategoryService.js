import * as adminCategoryModel from '../../models/admin/adminCategoryModel.js';

export const fetchCategories = async (isPublic) => {
    return await adminCategoryModel.getAllCategories(isPublic);
};

export const addCategory = async (payload) => {
    const { ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi } = payload;
    
    if (!ten_danh_muc) {
        const error = new Error('Category name is a required field!');
        error.statusCode = 400;
        throw error;
    }

    return await adminCategoryModel.createCategory(ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi || 0);
};

export const editCategory = async (id, payload) => {
    const updated = await adminCategoryModel.updateCategory(id, payload);
    if (!updated) {
        const error = new Error('Category not found!');
        error.statusCode = 404;
        throw error;
    }
    return updated;
};

export const removeCategory = async (id) => {
    const isDeleted = await adminCategoryModel.softDeleteCategory(id);
    if (!isDeleted) {
        const error = new Error('Category not found!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};