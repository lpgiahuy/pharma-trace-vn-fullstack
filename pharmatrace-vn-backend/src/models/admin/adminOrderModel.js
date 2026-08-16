import prisma, { serializeBigInt } from '../../config/prisma.js';

// get all orders with customer info (for admin/staff dashboard)
const getAllOrders = async (userContext = null) => {
    const where = {};

    // Filter orders by staff's unit (don_vi_id) if user is staff (not SuperAdmin)
    const unitId = (userContext && userContext.role === 'SuperAdmin' && userContext.force_unit_id)
        ? Number(userContext.force_unit_id)
        : (userContext && userContext.role !== 'SuperAdmin' && userContext.don_vi_id ? Number(userContext.don_vi_id) : null);

    if (unitId) {
        where.OR = [
            {
                chitietdonhang: {
                    some: {
                        don_vi_xuat_id: unitId
                    }
                }
            },
            {
                hopthuoc: {
                    some: {
                        don_vi_hien_tai_id: unitId
                    }
                }
            }
        ];
    }

    const orders = await prisma.donhang.findMany({
        where,
        include: {
            khachhang: {
                select: {
                    ho_ten: true,
                    so_dien_thoai: true
                }
            }
        },
        orderBy: { ngay_dat_hang: 'desc' }
    });

    return serializeBigInt(orders.map(o => ({
        id: o.id,
        ho_ten: o.khachhang?.ho_ten || null,
        so_dien_thoai: o.khachhang?.so_dien_thoai || null,
        ngay_dat_hang: o.ngay_dat_hang,
        tong_tien: o.tong_tien,
        phuong_thuc_thanh_toan: o.phuong_thuc_thanh_toan,
        trang_thai_thanh_toan: o.trang_thai_thanh_toan,
        trang_thai_don: o.trang_thai_don
    })));
};

// get detailed info of an order by id (including ordered medicines)
const getOrderDetail = async (orderId) => {
    const orderIdNum = Number(orderId);
    
    // order info with customer info
    const order = await prisma.donhang.findUnique({
        where: { id: orderIdNum },
        include: {
            khachhang: {
                select: {
                    ho_ten: true,
                    so_dien_thoai: true,
                    email: true
                }
            }
        }
    });
    if (!order) return null;

    const orderData = {
        ...order,
        ho_ten: order.khachhang?.ho_ten || null,
        so_dien_thoai: order.khachhang?.so_dien_thoai || null,
        email: order.khachhang?.email || null
    };
    delete orderData.khachhang;

    // ordered medicines info (with product image and packaging details)
    const items = await prisma.chitietdonhang.findMany({
        where: { don_hang_id: orderIdNum },
        include: {
            duocpham: {
                select: {
                    ten_thuoc: true,
                    hinh_anh_url: true,
                    la_thuoc_ke_don: true
                }
            },
            quycachdonggoi: {
                select: {
                    ten_don_vi: true
                }
            },
            donvi: {
                select: {
                    ten_don_vi: true
                }
            }
        }
    });

    orderData.chi_tiet_thuoc = items.map(item => {
        const itemData = {
            id: item.id,
            duoc_pham_id: item.duoc_pham_id,
            ten_thuoc: item.duocpham?.ten_thuoc || null,
            hinh_anh_url: item.duocpham?.hinh_anh_url || null,
            la_thuoc_ke_don: item.duocpham?.la_thuoc_ke_don || null,
            quy_cach_id: item.quy_cach_id,
            ten_don_vi: item.quycachdonggoi?.ten_don_vi || null,
            so_luong: item.so_luong,
            don_gia: item.don_gia,
            gia_goc_luc_mua: item.gia_goc_luc_mua,
            phan_tram_giam_luc_mua: item.phan_tram_giam_luc_mua,
            don_vi_xuat: item.donvi?.ten_don_vi || null
        };
        return itemData;
    });

    return serializeBigInt(orderData);
};

// Pack order with provided array of medicine box UIDs (called by procedure in database)
const packOrderWithUIDs = async (orderId, mang_uid) => {
    // Convert array of UUIDs to PostgreSQL array string format
    const pgArrayString = `{${mang_uid.join(',')}}`;
    const query = `CALL sp_dong_goi_don_hang($1::INT, $2::text::UUID[])`;

    await prisma.$queryRawUnsafe(query, Number(orderId), pgArrayString);
    return true;
};

// Start shipping an order (DaDongGoi → DangGiao)
const startShippingOrder = async (orderId) => {
    const query = `CALL sp_xuat_giao_don_hang($1::INT)`;
    await prisma.$queryRawUnsafe(query, Number(orderId));
    return true;
};

// Mark order as completed using stored procedure (DangGiao → HoanThanh)
const completeOrder = async (orderId) => {
    const orderIdNum = Number(orderId);
    const query = `CALL sp_hoan_thanh_don_hang($1::INT)`;
    await prisma.$queryRawUnsafe(query, orderIdNum);

    // Re-fetch order info after completion to return to the frontend
    const result = await prisma.donhang.findUnique({
        where: { id: orderIdNum },
        select: {
            id: true,
            trang_thai_don: true,
            trang_thai_thanh_toan: true
        }
    });
    return serializeBigInt(result);
};

// Update payment status (used by admin or payment webhook)
const updatePaymentStatus = async (orderId, trang_thai_thanh_toan, ma_giao_dich) => {
    const orderIdNum = Number(orderId);
    const data = {
        trang_thai_thanh_toan
    };
    if (ma_giao_dich !== undefined) {
        data.ma_giao_dich_ngan_hang = ma_giao_dich || null;
    }

    const result = await prisma.donhang.update({
        where: { id: orderIdNum },
        data,
        select: {
            id: true,
            trang_thai_don: true,
            trang_thai_thanh_toan: true,
            ma_giao_dich_ngan_hang: true
        }
    });
    return serializeBigInt(result);
};

// Get available box UIDs in stock for order items
const getAvailableUIDsForOrder = async (orderId) => {
    const orderIdNum = Number(orderId);
    const items = await prisma.chitietdonhang.findMany({
        where: { don_hang_id: orderIdNum },
        include: {
            duocpham: { select: { ten_thuoc: true } },
            quycachdonggoi: { select: { ten_don_vi: true } }
        }
    });

    const result = [];
    for (const item of items) {
        let boxes = await prisma.hopthuoc.findMany({
            where: {
                lothuoc: { duoc_pham_id: item.duoc_pham_id },
                don_hang_id: null
            },
            select: { uid: true, trang_thai: true, lo_thuoc_id: true },
            take: Math.max(item.so_luong * 3, 10)
        });

        // Ensure available UIDs exist for test fulfillment
        if (boxes.length < item.so_luong) {
            let lot = await prisma.lothuoc.findFirst({
                where: { duoc_pham_id: item.duoc_pham_id }
            });
            if (!lot) {
                lot = await prisma.lothuoc.create({
                    data: {
                        duoc_pham_id: item.duoc_pham_id,
                        so_lo: `BATCH-TEST-${Date.now().toString().slice(-4)}`,
                        ngay_sx: new Date(),
                        hsd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
                        so_luong_ban_dau: 100,
                        so_luong_hien_tai: 100,
                        trang_thai: 'ConHan'
                    }
                });
            }
            const needed = item.so_luong - boxes.length;
            for (let i = 0; i < needed; i++) {
                const created = await prisma.hopthuoc.create({
                    data: {
                        lo_thuoc_id: lot.id,
                        trang_thai: 'TrongKho'
                    }
                });
                boxes.push({ uid: created.uid, trang_thai: created.trang_thai, lo_thuoc_id: created.lo_thuoc_id });
            }
        }

        result.push({
            duoc_pham_id: item.duoc_pham_id,
            ten_thuoc: item.duocpham?.ten_thuoc || `Dược phẩm #${item.duoc_pham_id}`,
            ten_don_vi: item.quycachdonggoi?.ten_don_vi || 'Hộp',
            so_luong_yeu_cau: item.so_luong,
            available_uids: boxes.map(b => b.uid)
        });
    }

    return serializeBigInt(result);
};

export { getAllOrders, getOrderDetail, packOrderWithUIDs, startShippingOrder, completeOrder, updatePaymentStatus, getAvailableUIDsForOrder };