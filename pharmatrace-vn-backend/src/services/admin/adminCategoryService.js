import * as adminCategoryModel from '../../models/admin/adminCategoryModel.js';
import prisma from '../../config/prisma.js';

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
    const categoryId = Number(id);

    // 1. Block deletion if this category contains child subcategories
    const subCount = await prisma.danhmuc.count({
        where: { danh_muc_cha_id: categoryId }
    });

    if (subCount > 0) {
        const error = new Error(`Không thể xóa danh mục này vì đang chứa ${subCount} danh mục con. Vui lòng xóa các danh mục con trước.`);
        error.statusCode = 400;
        throw error;
    }

    // 2. Perform hard delete permanently from database
    try {
        const isDeleted = await adminCategoryModel.hardDeleteCategory(categoryId);
        if (!isDeleted) {
            const error = new Error('Category not found!');
            error.statusCode = 404;
            throw error;
        }
        return { isSoftDeleted: false, message: 'Đã xóa vĩnh viễn danh mục thành công!' };
    } catch (error) {
        // Foreign key constraint violation (e.g. products exist in this category)
        if (error.code === '23503' || error.code === 'P2003') {
            await adminCategoryModel.softDeleteCategory(categoryId);
            return {
                isSoftDeleted: true,
                message: 'Danh mục này đã có sản phẩm thuộc về nên hệ thống đã tự động chuyển sang trạng thái ẨN để bảo toàn lịch sử dữ liệu.'
            };
        }
        throw error;
    }
};