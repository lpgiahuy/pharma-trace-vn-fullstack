import * as adminCategoryService from '../../services/admin/adminCategoryService.js';

const getPublicCategories = async (req, res, next) => {
    try {
        const data = await adminCategoryService.fetchCategories(true); // true = only get active categories for public
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getAllCategoriesAdmin = async (req, res, next) => {
    try {
        const data = await adminCategoryService.fetchCategories(false); // false = admin gets all categories including inactive ones
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
    try {
        const data = await adminCategoryService.addCategory(req.body);
        res.status(201).json({ success: true, message: 'Thêm danh mục thành công!', data });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400); return next(new Error('Tên danh mục này đã tồn tại!'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const data = await adminCategoryService.editCategory(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Cập nhật danh mục thành công!', data });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400); return next(new Error('Tên danh mục này đã bị trùng!'));
        }
        if (error.code === '23503') {
            res.status(400); return next(new Error('Danh mục cha không tồn tại! Vui lòng kiểm tra lại.'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const result = await adminCategoryService.removeCategory(req.params.id);
        res.status(200).json({ success: true, message: result.message, data: result });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getPublicCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory };