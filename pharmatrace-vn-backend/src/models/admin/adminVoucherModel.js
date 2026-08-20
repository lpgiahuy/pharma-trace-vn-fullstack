import prisma, { serializeBigInt } from '../../config/prisma.js';

export const getAllVouchers = async () => {
    const result = await prisma.khuyenmai.findMany({
        orderBy: { id: 'desc' }
    });
    return serializeBigInt(result);
};

export const createVoucher = async (data) => {
    const { ma_code, loai_giam_gia, gia_tri, don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, so_luong_gioi_han } = data;
    const result = await prisma.khuyenmai.create({
        data: {
            ma_code,
            loai_giam_gia,
            gia_tri: Number(gia_tri),
            don_hang_toi_thieu: don_hang_toi_thieu !== undefined ? Number(don_hang_toi_thieu) : undefined,
            ngay_bat_dau: new Date(ngay_bat_dau),
            ngay_ket_thuc: new Date(ngay_ket_thuc),
            so_luong_gioi_han: so_luong_gioi_han !== undefined ? Number(so_luong_gioi_han) : null
        }
    });
    return serializeBigInt(result);
};

export const deleteVoucher = async (id) => {
    // This table has no soft delete, so perform a hard delete
    const deleted = await prisma.khuyenmai.delete({
        where: { id: Number(id) }
    });
    return !!deleted;
};