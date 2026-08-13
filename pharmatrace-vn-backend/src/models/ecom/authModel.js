import prisma, { serializeBigInt } from '../../config/prisma.js';

// Check if user exists by phone number
const findUserByPhone = async (phone) => {
    return await prisma.khachhang.findUnique({
        where: { so_dien_thoai: phone }
    });
};

const createUser = async (name, phone, hashedPassword, email = null, address = null) => {
    const user = await prisma.khachhang.create({
        data: {
            ho_ten: name,
            so_dien_thoai: phone,
            mat_khau_hash: hashedPassword,
            email: email || null,
            dia_chi_mac_dinh: address || null
        },
        select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            dia_chi_mac_dinh: true,
            hang_thanh_vien: true,
            diem_tich_luy: true
        }
    });
    return {
        ...user,
        dia_chi: user.dia_chi_mac_dinh
    };
};

const findUserById = async (id) => {
    const user = await prisma.khachhang.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            dia_chi_mac_dinh: true,
            hang_thanh_vien: true,
            diem_tich_luy: true
        }
    });
    if (!user) return null;
    return {
        ...user,
        dia_chi: user.dia_chi_mac_dinh
    };
};

// Find full user record (including password hash) for password change verification
const findFullUserById = async (id) => {
    return await prisma.khachhang.findUnique({
        where: { id: Number(id) }
    });
};

const updateUserProfile = async (id, { ho_ten, email, dia_chi_mac_dinh }) => {
    const data = {};
    if (ho_ten !== undefined) data.ho_ten = ho_ten || null;
    if (email !== undefined) data.email = email || null;
    if (dia_chi_mac_dinh !== undefined) data.dia_chi_mac_dinh = dia_chi_mac_dinh || null;

    const user = await prisma.khachhang.update({
        where: { id: Number(id) },
        data,
        select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            dia_chi_mac_dinh: true,
            hang_thanh_vien: true,
            diem_tich_luy: true
        }
    });
    if (!user) return null;
    return {
        ...user,
        dia_chi: user.dia_chi_mac_dinh
    };
};

const updateUserPassword = async (id, newHashedPassword) => {
    await prisma.khachhang.update({
        where: { id: Number(id) },
        data: { mat_khau_hash: newHashedPassword }
    });
    return true;
};

const findStaffById = async (id) => {
    const staff = await prisma.nhanvien.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            ho_ten: true,
            email: true,
            vai_tro: true,
            trang_thai: true,
            don_vi_id: true
        }
    });
    if (!staff) return null;
    return {
        ...staff,
        so_dien_thoai: '',
        name: staff.ho_ten,
        role: staff.vai_tro
    };
};

const getLoyaltyUpgradeProgress = async (id) => {
    const result = await prisma.$queryRaw`SELECT * FROM fn_get_loyalty_upgrade_progress(${Number(id)})`;
    return serializeBigInt(result[0]);
};

export { findUserByPhone, createUser, findUserById, findStaffById, findFullUserById, updateUserProfile, updateUserPassword, getLoyaltyUpgradeProgress };