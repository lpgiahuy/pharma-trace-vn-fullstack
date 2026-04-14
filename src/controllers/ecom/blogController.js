import { getAllBlogs, getBlogById } from '../../models/admin/adminBlogModel.js';

// Reuse the blog model from admin — blog data is shared, only auth differs
const listBlogs = async (req, res, next) => {
    try {
        const data = await getAllBlogs();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getBlogDetail = async (req, res, next) => {
    try {
        const blog = await getBlogById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
        }
        res.status(200).json({ success: true, data: blog });
    } catch (error) { next(error); }
};

export { listBlogs, getBlogDetail };
