import prisma, { serializeBigInt } from '../../config/prisma.js';

const getCartItems = async (userId) => {
    const items = await prisma.chitietgiohang.findMany({
        where: { khach_hang_id: Number(userId) },
        include: {
            duocpham: {
                select: {
                    ten_thuoc: true,
                    hinh_anh_url: true
                }
            },
            quycachdonggoi: {
                select: {
                    ten_don_vi: true,
                    gia_ban: true
                }
            }
        },
        orderBy: { ngay_them: 'desc' }
    });

    return serializeBigInt(items.map(item => {
        const gia_ban = item.quycachdonggoi?.gia_ban || 0;
        return {
            cart_item_id: item.id,
            duoc_pham_id: item.duoc_pham_id,
            quy_cach_id: item.quy_cach_id,
            so_luong: item.so_luong,
            ten_thuoc: item.duocpham?.ten_thuoc || null,
            hinh_anh_url: item.duocpham?.hinh_anh_url || null,
            ten_don_vi: item.quycachdonggoi?.ten_don_vi || null,
            gia_ban: gia_ban,
            thanh_tien: Number(item.so_luong) * Number(gia_ban)
        };
    }));
};

const upsertCartItem = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    // add or update cart item
    const query = `
        INSERT INTO ChiTietGioHang (khach_hang_id, duoc_pham_id, quy_cach_id, so_luong)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (khach_hang_id, duoc_pham_id, quy_cach_id)
        DO UPDATE SET so_luong = ChiTietGioHang.so_luong + EXCLUDED.so_luong, 
                      ngay_them = CURRENT_TIMESTAMP
        RETURNING *;
    `;
    const result = await prisma.$queryRawUnsafe(query, Number(userId), Number(duoc_pham_id), Number(quy_cach_id), Number(so_luong));
    return serializeBigInt(result[0]);
};

const updateItemQuantity = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    const query = `
        UPDATE ChiTietGioHang 
        SET so_luong = $4, ngay_them = CURRENT_TIMESTAMP
        WHERE khach_hang_id = $1 AND duoc_pham_id = $2 AND quy_cach_id = $3
        RETURNING *;
    `;
    const result = await prisma.$queryRawUnsafe(query, Number(userId), Number(duoc_pham_id), Number(quy_cach_id), Number(so_luong));
    return serializeBigInt(result[0]);
};

const removeCartItem = async (userId, duoc_pham_id, quy_cach_id) => {
    if (quy_cach_id) {
        const deleted = await prisma.chitietgiohang.deleteMany({
            where: {
                khach_hang_id: Number(userId),
                duoc_pham_id: Number(duoc_pham_id),
                quy_cach_id: Number(quy_cach_id)
            }
        });
        return deleted.count > 0;
    } else {
        const deleted = await prisma.chitietgiohang.deleteMany({
            where: {
                khach_hang_id: Number(userId),
                duoc_pham_id: Number(duoc_pham_id)
            }
        });
        return deleted.count > 0;
    }
};

export { getCartItems, upsertCartItem, updateItemQuantity, removeCartItem };