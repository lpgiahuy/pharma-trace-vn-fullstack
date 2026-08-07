import prisma, { serializeBigInt } from '../../config/prisma.js';

// get all blogs for public listing (customer view) - sorted by newest first, include author name
const getAllBlogs = async () => {
    const blogs = await prisma.baiviet.findMany({
        orderBy: { ngay_dang: 'desc' },
        include: {
            nhanvien: { select: { ho_ten: true } }
        }
    });
    return serializeBigInt(blogs.map(b => ({
        ...b,
        nguoi_dang: b.nhanvien?.ho_ten || null,
        nhanvien: undefined
    })));
};

// get detailed information of a blog post for reading
const getBlogById = async (id) => {
    const blog = await prisma.baiviet.findUnique({
        where: { id: Number(id) },
        include: {
            nhanvien: { select: { ho_ten: true } }
        }
    });
    if (!blog) return null;
    return serializeBigInt({
        ...blog,
        nguoi_dang: blog.nhanvien?.ho_ten || null,
        nhanvien: undefined
    });
};

// create a new blog post
const createBlog = async (tieu_de, anh_bia, noi_dung, chuyen_muc, nhan_vien_dang_id) => {
    const blog = await prisma.baiviet.create({
        data: {
            tieu_de,
            anh_bia,
            noi_dung,
            nhan_vien_dang_id: nhan_vien_dang_id ? Number(nhan_vien_dang_id) : null
        }
    });
    return serializeBigInt(blog);
};

// update an existing blog post
const updateBlog = async (id, tieu_de, anh_bia, noi_dung, chuyen_muc) => {
    const blog = await prisma.baiviet.update({
        where: { id: Number(id) },
        data: {
            ...(tieu_de  !== undefined && { tieu_de }),
            ...(anh_bia  !== undefined && { anh_bia }),
            ...(noi_dung !== undefined && { noi_dung }),
        }
    });
    return serializeBigInt(blog);
};

// delete a blog post
const deleteBlog = async (id) => {
    try {
        await prisma.baiviet.delete({ where: { id: Number(id) } });
        return true;
    } catch {
        return false;
    }
};

export { getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
