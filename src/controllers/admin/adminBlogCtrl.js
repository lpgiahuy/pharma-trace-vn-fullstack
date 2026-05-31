import * as adminBlogService from '../../services/admin/adminBlogService.js';

const getPublicBlogs = async (req, res, next) => {
    try {
        const data = await adminBlogService.fetchBlogs();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getPublicBlogDetail = async (req, res, next) => {
    try {
        const data = await adminBlogService.fetchBlogDetail(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const createNewBlog = async (req, res, next) => {
    try {
        // req.user.id is the ID of the currently logged-in staff member (set by the protect middleware)
        const data = await adminBlogService.addBlog(req.body, req.user.id);
        res.status(201).json({ success: true, message: 'Blog created successfully!', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateExistingBlog = async (req, res, next) => {
    try {
        const data = await adminBlogService.editBlog(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Blog updated successfully!', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const deleteExistingBlog = async (req, res, next) => {
    try {
        await adminBlogService.removeBlog(req.params.id);
        res.status(200).json({ success: true, message: 'Blog deleted successfully!' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getPublicBlogs, getPublicBlogDetail, createNewBlog, updateExistingBlog, deleteExistingBlog };

//