import prisma from '../../config/prisma.js';

// find employee by email (used for login)
const getEmployeeByEmail = async (email) => {
    return await prisma.nhanvien.findFirst({
        where: {
            email,
            trang_thai: true
        },
        select: {
            id: true,
            don_vi_id: true,
            ho_ten: true,
            email: true,
            mat_khau_hash: true,
            vai_tro: true
        }
    });
};

// helper function to create the first SuperAdmin (used during system initialization)
const createFirstAdmin = async (don_vi_id, ho_ten, email, mat_khau_hash, vai_tro) => {
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

export { getEmployeeByEmail, createFirstAdmin };