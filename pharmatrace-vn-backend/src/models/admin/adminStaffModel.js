import prisma from '../../config/prisma.js';

// get list of all staff members (including their assigned unit)
const getAllStaff = async () => {
    const staff = await prisma.nhanvien.findMany({
        where: { trang_thai: true },
        include: {
            donvi: {
                select: { ten_don_vi: true }
            }
        },
        orderBy: { id: 'desc' }
    });
    
    return staff.map(nv => ({
        id: nv.id,
        ho_ten: nv.ho_ten,
        email: nv.email,
        vai_tro: nv.vai_tro,
        trang_thai: nv.trang_thai,
        don_vi_id: nv.don_vi_id,
        ten_don_vi: nv.donvi?.ten_don_vi || null
    }));
};

// create new staff account
const createStaff = async (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro) => {
    return await prisma.nhanvien.create({
        data: {
            don_vi_id,
            ho_ten,
            email,
            mat_khau_hash,
            vai_tro
        },
        select: {
            id: true,
            ho_ten: true,
            email: true,
            vai_tro: true
        }
    });
};

// update staff information (except password)
const updateStaff = async (id, don_vi_id, ho_ten, vai_tro, trang_thai) => {
    const data = {};
    if (don_vi_id !== undefined) data.don_vi_id = don_vi_id;
    if (ho_ten !== undefined) data.ho_ten = ho_ten;
    if (vai_tro !== undefined) data.vai_tro = vai_tro;
    if (trang_thai !== undefined) data.trang_thai = trang_thai;

    return await prisma.nhanvien.update({
        where: { id: Number(id) },
        data,
        select: {
            id: true,
            ho_ten: true,
            vai_tro: true,
            trang_thai: true
        }
    });
};

// disable staff account (soft delete)
const softDeleteStaff = async (id) => {
    const updated = await prisma.nhanvien.update({
        where: { id: Number(id) },
        data: { trang_thai: false }
    });
    return !!updated;
};

export { getAllStaff, createStaff, updateStaff, softDeleteStaff };