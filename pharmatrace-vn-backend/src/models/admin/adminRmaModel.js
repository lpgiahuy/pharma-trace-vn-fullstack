import prisma, { serializeBigInt } from '../../config/prisma.js';

export const getAllRmaRequests = async () => {
    const requests = await prisma.phieutrahang.findMany({
        orderBy: { ngay_yeu_cau: 'desc' },
        include: {
            khachhang: { select: { ho_ten: true, so_dien_thoai: true } }
        }
    });
    return serializeBigInt(requests.map(p => ({
        ...p,
        ho_ten: p.khachhang?.ho_ten || null,
        so_dien_thoai: p.khachhang?.so_dien_thoai || null,
        khachhang: undefined
    })));
};

export const updateRmaStatus = async (id, trang_thai_duyet) => {
    const result = await prisma.phieutrahang.update({
        where: { id: Number(id) },
        data: { trang_thai_duyet }
    });
    return serializeBigInt(result);
};