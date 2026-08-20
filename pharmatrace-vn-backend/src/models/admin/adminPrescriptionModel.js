import prisma, { serializeBigInt } from '../../config/prisma.js';

// Get list of prescriptions (optionally filtered by status: ChoDuyet, HopLe, TuChoi)
export const getPrescriptions = async (status) => {
    const prescriptions = await prisma.toathuoc.findMany({
        where: status ? { trang_thai_duyet: status } : undefined,
        orderBy: { ngay_tao: 'desc' },
        include: {
            khachhang: { select: { ho_ten: true, so_dien_thoai: true } }
        }
    });
    return serializeBigInt(prescriptions.map(t => ({
        ...t,
        ten_khach_hang: t.khachhang?.ho_ten || null,
        so_dien_thoai: t.khachhang?.so_dien_thoai || null,
        khachhang: undefined
    })));
};

// Pharmacist updates prescription approval status
export const updatePrescriptionStatus = async (id, trang_thai) => {
    const result = await prisma.toathuoc.update({
        where: { id: Number(id) },
        data: { trang_thai_duyet: trang_thai },
        select: { id: true, trang_thai_duyet: true }
    });
    return result;
};