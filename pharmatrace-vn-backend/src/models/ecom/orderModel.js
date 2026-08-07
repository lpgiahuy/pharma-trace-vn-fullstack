import prisma, { serializeBigInt } from '../../config/prisma.js';

export const callCheckoutProcedure = async (userId, dia_chi_giao, phuong_thuc_tt, ma_giam_gia, diem_su_dung, phi_ship, don_vi_xuat_id = null, client = null) => {
    // Note: sp_tao_don_hang_tu_gio is a stored procedure, so queryRawUnsafe is required
    await prisma.$queryRawUnsafe(
        `CALL sp_tao_don_hang_tu_gio($1, $2, $3, $4, $5, $6, $7)`,
        Number(userId),
        don_vi_xuat_id ? Number(don_vi_xuat_id) : null,
        dia_chi_giao,
        phuong_thuc_tt,
        ma_giam_gia || null,
        Number(diem_su_dung || 0),
        Number(phi_ship || 0)
    );

    const latestOrder = await prisma.donhang.findFirst({
        where: { khach_hang_id: Number(userId) },
        orderBy: { ngay_dat_hang: 'desc' }
    });

    return serializeBigInt(latestOrder);
};

export const getShippingFee = async (distance) => {
    const result = await prisma.$queryRawUnsafe('SELECT fn_calculate_shipping_fee($1) as fee', Number(distance));
    return parseFloat(result[0].fee);
};

export const addLoyaltyPoints = async (userId, amount) => {
    const pointsToEarn = Math.floor(amount * 0.005); // Earn 0.5% of order value as points
    const updated = await prisma.khachhang.update({
        where: { id: Number(userId) },
        data: {
            diem_tich_luy: {
                increment: pointsToEarn
            }
        },
        select: {
            diem_tich_luy: true,
            hang_thanh_vien: true
        }
    });

    return {
        pointsEarned: pointsToEarn,
        newTotalPoints: updated.diem_tich_luy,
        newTier: updated.hang_thanh_vien
    };
};

export const getOrdersByUserId = async (userId, limit = 10, offset = 0) => {
    const query = `
        SELECT dh.*, dh.trang_thai_don AS trang_thai,
        (SELECT COUNT(*) FROM ChiTietDonHang WHERE don_hang_id = dh.id) as items_count
        FROM DonHang dh WHERE khach_hang_id = $1 ORDER BY ngay_dat_hang DESC
        LIMIT $2 OFFSET $3`;
    const res = await prisma.$queryRawUnsafe(query, Number(userId), Number(limit), Number(offset));
    return serializeBigInt(res);
};

export const cancelOrder = async (orderId, userId) => {
    // Calls stored procedure: validates 'ChoXacNhan' status and throws if invalid
    await prisma.$queryRawUnsafe(`CALL sp_huy_don_hang_khach($1::INT, $2::INT)`, Number(orderId), Number(userId));
    return true;
};

export const getOrderDetailById = async (orderId, userId) => {
    const orderIdNum = Number(orderId);
    const userIdNum = Number(userId);

    const order = await prisma.donhang.findFirst({
        where: {
            id: orderIdNum,
            khach_hang_id: userIdNum
        },
        include: {
            khachhang: {
                select: { ho_ten: true }
            }
        }
    });
    if (!order) return null;

    const orderData = {
        ...order,
        trang_thai: order.trang_thai_don,
        khach_hang_ten: order.khachhang?.ho_ten || null
    };
    delete orderData.khachhang;

    const items = await prisma.chitietdonhang.findMany({
        where: { don_hang_id: orderIdNum },
        include: {
            duocpham: {
                select: { ten_thuoc: true }
            },
            quycachdonggoi: {
                select: { ten_don_vi: true }
            }
        }
    });

    orderData.items = items.map(item => {
        const itemData = {
            ...item,
            ten_thuoc: item.duocpham?.ten_thuoc || null,
            ten_don_vi: item.quycachdonggoi?.ten_don_vi || null
        };
        delete itemData.duocpham;
        delete itemData.quycachdonggoi;
        return itemData;
    });

    return serializeBigInt(orderData);
};