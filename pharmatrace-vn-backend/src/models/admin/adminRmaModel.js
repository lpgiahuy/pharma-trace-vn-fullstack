import prisma, { serializeBigInt } from '../../config/prisma.js';
import { getCurrentUserContext } from '../../utils/userContext.js';

export const getAllRmaRequests = async () => {
    const userContext = getCurrentUserContext();
    const unitId = (userContext && ['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.force_unit_id)
        ? Number(userContext.force_unit_id)
        : (userContext && !['SuperAdmin', 'superadmin'].includes(userContext.role) && userContext.don_vi_id ? Number(userContext.don_vi_id) : null);

    const where = {};
    if (unitId) {
        where.donhang = {
            OR: [
                { chitietdonhang: { some: { don_vi_xuat_id: unitId } } },
                { hopthuoc: { some: { don_vi_hien_tai_id: unitId } } }
            ]
        };
    }

    const requests = await prisma.phieutrahang.findMany({
        where,
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