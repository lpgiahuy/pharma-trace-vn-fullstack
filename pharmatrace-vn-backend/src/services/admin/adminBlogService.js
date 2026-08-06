import * as adminBlogModel from '../../models/admin/adminBlogModel.js';

const fetchBlogs = async () => {
    return await adminBlogModel.getAllBlogs();
};

const fetchBlogDetail = async (id) => {
    const blog = await adminBlogModel.getBlogById(id);
    if (!blog) {
        const error = new Error('Blog does not exist!');
        error.statusCode = 404;
        throw error;
    }
    return blog;
};

const addBlog = async (payload, nhan_vien_id) => {
    const { tieu_de, anh_bia, noi_dung, chuyen_muc } = payload;
    
    if (!tieu_de || !noi_dung) {
        const error = new Error('Title and content are required!');
        error.statusCode = 400;
        throw error;
    }

    return await adminBlogModel.createBlog(tieu_de, anh_bia, noi_dung, chuyen_muc, nhan_vien_id);
};

const editBlog = async (id, payload) => {
    const { tieu_de, anh_bia, noi_dung, chuyen_muc } = payload;
    const updated = await adminBlogModel.updateBlog(id, tieu_de, anh_bia, noi_dung, chuyen_muc);
    
    if (!updated) {
        const error = new Error('Blog does not exist!');
        error.statusCode = 404;
        throw error;
    }
    return updated;
};

const removeBlog = async (id) => {
    const isDeleted = await adminBlogModel.deleteBlog(id);
    if (!isDeleted) {
        const error = new Error('Blog does not exist!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

export { fetchBlogs, fetchBlogDetail, addBlog, editBlog, removeBlog };