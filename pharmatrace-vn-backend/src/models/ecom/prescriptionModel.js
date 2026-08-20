import prisma, { serializeBigInt } from '../../config/prisma.js';

export const createPrescription = async (khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan) => {
    const result = await prisma.toathuoc.create({
        data: {
            khach_hang_id: Number(khach_hang_id),
            hinh_anh_toa,
            ten_bac_si,
            ten_benh_vien,
            chuan_doan
        },
        select: {
            id: true,
            hinh_anh_toa: true,
            trang_thai_duyet: true,
            ngay_tao: true
        }
    });
    return result;
};

export const getPrescriptionsByUserId = async (userId, limit = 10, offset = 0) => {
    const results = await prisma.toathuoc.findMany({
        where: { khach_hang_id: Number(userId) },
        orderBy: { ngay_tao: 'desc' },
        take: Number(limit),
        skip: Number(offset)
    });
    return serializeBigInt(results);
};