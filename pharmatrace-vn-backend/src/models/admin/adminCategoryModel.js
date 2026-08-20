import prisma from '../../config/prisma.js';

const getAllCategories = async (chi_lay_hoat_dong = false) => {
    return await prisma.danhmuc.findMany({
        where: chi_lay_hoat_dong ? { trang_thai: true } : {},
        orderBy: [
            { thu_tu_hien_thi: 'asc' },
            { id: 'desc' }
        ]
    });
};

const createCategory = async (ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi) => {
    return await prisma.danhmuc.create({
        data: {
            ten_danh_muc,
            danh_muc_cha_id,
            hinh_anh_icon,
            thu_tu_hien_thi
        }
    });
};

const updateCategory = async (id, payload) => {
    const { ten_danh_muc, danh_muc_cha_id, hinh_anh_icon, thu_tu_hien_thi, trang_thai } = payload;
    
    // Build update payload, ignoring undefined values to match COALESCE behavior
    const data = {};
    if (ten_danh_muc !== undefined) data.ten_danh_muc = ten_danh_muc;
    if (danh_muc_cha_id !== undefined) data.danh_muc_cha_id = danh_muc_cha_id;
    if (hinh_anh_icon !== undefined) data.hinh_anh_icon = hinh_anh_icon;
    if (thu_tu_hien_thi !== undefined) data.thu_tu_hien_thi = thu_tu_hien_thi;
    if (trang_thai !== undefined) data.trang_thai = trang_thai;

    return await prisma.danhmuc.update({
        where: { id: Number(id) },
        data
    });
};

const softDeleteCategory = async (id) => {
    const updated = await prisma.danhmuc.update({
        where: { id: Number(id) },
        data: { trang_thai: false }
    });
    return !!updated;
};

const hardDeleteCategory = async (id) => {
    const deleted = await prisma.danhmuc.delete({
        where: { id: Number(id) }
    });
    return !!deleted;
};

export { getAllCategories, createCategory, updateCategory, softDeleteCategory, hardDeleteCategory };