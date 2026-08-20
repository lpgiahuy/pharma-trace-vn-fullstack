import prisma, { serializeBigInt } from '../../config/prisma.js';
import * as productModel from '../../models/ecom/productModel.js';

const processCheckout = async (userId, payload) => {
    const { 
        dia_chi_giao_hang, 
        phuong_thuc_thanh_toan, 
        ma_giam_gia, 
        voucher_id,
        diem_su_dung, 
        lat, 
        lng 
    } = payload;

    const dbVoucher = ma_giam_gia || voucher_id || null;
    const points = diem_su_dung ? parseInt(diem_su_dung) : 0;

    let cartItems = [];

    // Use Prisma interactive transaction to manage entire checkout atomically
    const newOrder = await prisma.$transaction(async (tx) => {
        // 1. Get cart items (with product and variant info)
        const rawItems = await tx.chitietgiohang.findMany({
            where: { khach_hang_id: Number(userId) },
            include: {
                duocpham: { select: { ten_thuoc: true } },
                quycachdonggoi: { select: { gia_ban: true } }
            }
        });

        if (rawItems.length === 0) {
            const error = new Error('Your cart is empty!');
            error.statusCode = 400;
            throw error;
        }

        cartItems = rawItems.map(item => ({
            duoc_pham_id: item.duoc_pham_id,
            quy_cach_id: item.quy_cach_id,
            so_luong: item.so_luong,
            ten_thuoc: item.duocpham?.ten_thuoc || null,
        }));

        // 2. Lock inventory rows to prevent race conditions
        const productIds = cartItems.map(item => item.duoc_pham_id);
        await tx.$queryRawUnsafe(
            `SELECT 1 FROM TonKho WHERE duoc_pham_id = ANY($1::int[]) FOR UPDATE`,
            productIds
        );

        // 3. Check inventory for each cart item
        for (const item of cartItems) {
            const stockResult = await tx.$queryRawUnsafe(
                `SELECT COALESCE(SUM(so_luong_ton), 0) AS total_stock FROM TonKho WHERE duoc_pham_id = $1`,
                Number(item.duoc_pham_id)
            );
            const totalStock = parseInt(stockResult[0].total_stock);

            if (totalStock < item.so_luong) {
                const error = new Error(`Product "${item.ten_thuoc}" is out of stock. (Available: ${totalStock})`);
                error.statusCode = 400;
                throw error;
            }
        }

        // 4. Find a pharmacy that can fulfill ALL items in the cart
        let phiShip = 30000;
        let nearestStoreId = null;

        const storeWithAll = await productModel.findStoreWithAllItems(cartItems, lat, lng);

        if (storeWithAll) {
            nearestStoreId = storeWithAll.don_vi_id;
            // If we have coordinates, calculate real shipping fee from this store
            if (lat && lng) {
                const distanceRes = await tx.$queryRawUnsafe(
                    `SELECT fn_tinh_khoang_cach_km($1, $2, toa_do_lat, toa_do_lng) AS km FROM DonVi WHERE id = $3`,
                    Number(lat), Number(lng), Number(nearestStoreId)
                );
                if (distanceRes[0]?.km) {
                    const feeResult = await tx.$queryRawUnsafe(
                        `SELECT fn_calculate_shipping_fee($1) as fee`,
                        Number(distanceRes[0].km)
                    );
                    phiShip = parseFloat(feeResult[0].fee);
                }
            }
        } else {
            // Fallback: find any store with stock for first item
            const fallbackStore = await productModel.getNearestPharmacy(cartItems[0].duoc_pham_id, lat, lng, cartItems[0].so_luong);
            nearestStoreId = fallbackStore?.don_vi_id || null;

            if (!nearestStoreId) {
                const anyStore = await tx.$queryRawUnsafe(`SELECT id FROM DonVi WHERE loai_don_vi = 'NhaThuoc' LIMIT 1`);
                nearestStoreId = anyStore[0]?.id || null;
            }
        }

        // 5. Create the order using stored procedure
        try {
            await tx.$queryRawUnsafe(
                `CALL sp_tao_don_hang_tu_gio($1, $2, $3, $4, $5, $6, $7)`,
                Number(userId),
                nearestStoreId ? Number(nearestStoreId) : null,
                dia_chi_giao_hang,
                phuong_thuc_thanh_toan,
                dbVoucher || null,
                points,
                Number(phiShip)
            );
        } catch (procErr) {
            const msg = procErr.message || '';
            if (msg.includes('P0001') || msg.includes('không có sản phẩm') || msg.includes('Tồn kho không đủ')) {
                const error = new Error('Rất tiếc, sản phẩm trong giỏ hàng hiện đang hết hàng tại nhà thuốc. Vui lòng chọn sản phẩm khác hoặc nhập thêm kho.');
                error.statusCode = 400;
                throw error;
            }
            throw procErr;
        }

        // Update sold count on DuocPham table for ordered products
        for (const item of cartItems) {
            await tx.$executeRawUnsafe(
                `UPDATE DuocPham SET so_luong_da_ban = COALESCE(so_luong_da_ban, 0) + $1 WHERE id = $2`,
                Number(item.so_luong),
                Number(item.duoc_pham_id)
            );
        }

        // Fetch the newly created order
        const createdOrder = await tx.donhang.findFirst({
            where: { khach_hang_id: Number(userId) },
            orderBy: { ngay_dat_hang: 'desc' }
        });

        if (!createdOrder) {
            const error = new Error('Failed to create order.');
            error.statusCode = 500;
            throw error;
        }

        // 6. Handle reward points inside the transaction
        const pointsToEarn = Math.floor(Number(createdOrder.tong_tien || 0) * 0.005);
        const updatedCustomer = await tx.khachhang.update({
            where: { id: Number(userId) },
            data: { diem_tich_luy: { increment: pointsToEarn } },
            select: { diem_tich_luy: true, hang_thanh_vien: true }
        });

        const orderResult = serializeBigInt(createdOrder);
        orderResult.rewardInfo = {
            pointsEarned: pointsToEarn,
            newTotalPoints: updatedCustomer.diem_tich_luy,
            newTier: updatedCustomer.hang_thanh_vien
        };

        return orderResult;

    }, {
        maxWait: 10000,  // max wait for transaction to start (ms)
        timeout: 30000   // max transaction duration (ms)
    });

    // Translate database trigger error for frontend user
    return newOrder;
};

const cancelUserOrder = async (orderId, userId) => {
    try {
        await prisma.$queryRawUnsafe(`CALL sp_huy_don_hang_khach($1::INT, $2::INT)`, Number(orderId), Number(userId));
        return { don_hang_id: orderId, trang_thai_moi: 'Cancelled' };
    } catch (err) {
        // Translate database trigger error
        let message = err.message || 'Cannot cancel this order.';
        if (message.includes('không đủ số lượng cho sản phẩm')) {
            message = 'Xin lỗi, một số sản phẩm trong giỏ không đủ tồn kho tại cùng một chi nhánh để giao hàng.';
        }
        const error = new Error(message);
        error.statusCode = 400;
        throw error;
    }
};

const fetchUserOrders = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT dh.*, dh.trang_thai_don AS trang_thai,
        (SELECT COUNT(*) FROM ChiTietDonHang WHERE don_hang_id = dh.id) as items_count
        FROM DonHang dh WHERE khach_hang_id = $1 ORDER BY ngay_dat_hang DESC
        LIMIT $2 OFFSET $3`;
    const res = await prisma.$queryRawUnsafe(query, Number(userId), Number(limit), Number(offset));
    return serializeBigInt(res);
};

const fetchUserOrderDetail = async (orderId, userId) => {
    const orderIdNum = Number(orderId);
    const userIdNum = Number(userId);

    const order = await prisma.donhang.findFirst({
        where: { id: orderIdNum, khach_hang_id: userIdNum },
        include: { khachhang: { select: { ho_ten: true } } }
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
            duocpham: { select: { ten_thuoc: true } },
            quycachdonggoi: { select: { ten_don_vi: true } }
        }
    });

    orderData.items = items.map(item => ({
        ...item,
        ten_thuoc: item.duocpham?.ten_thuoc || null,
        ten_don_vi: item.quycachdonggoi?.ten_don_vi || null,
        duocpham: undefined,
        quycachdonggoi: undefined
    }));

    return serializeBigInt(orderData);
};

const confirmReceipt = async (orderId, userId) => {
    const order = await prisma.donhang.findFirst({
        where: { id: Number(orderId), khach_hang_id: Number(userId) }
    });
    if (!order) {
        const error = new Error('Không tìm thấy đơn hàng.');
        error.statusCode = 404;
        throw error;
    }

    if (order.trang_thai_don === 'DaHuy') {
        const error = new Error('Đơn hàng đã bị hủy, không thể xác nhận nhận hàng.');
        error.statusCode = 400;
        throw error;
    }

    if (order.trang_thai_don === 'HoanThanh') {
        return serializeBigInt(order);
    }

    const updated = await prisma.donhang.update({
        where: { id: Number(orderId) },
        data: {
            trang_thai_don: 'HoanThanh',
            trang_thai_thanh_toan: 'DaThanhToan'
        }
    });

    try {
        await prisma.$executeRawUnsafe(
            `UPDATE vanchuyen SET trang_thai_giao = 'GiaoThanhCong', trang_thai_cod = 'ChuaDoiSoat', ngay_giao_thuc_te = NOW() WHERE don_hang_id = $1`,
            Number(orderId)
        );

        // Record delivery success into LichSuPhanPhoi for customer's medicine boxes
        await prisma.$executeRawUnsafe(
            `INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, loai_giao_dich, ghi_chu)
             SELECT uid, 'GiaoHangThanhCong', 'Khách hàng xác nhận đã nhận hàng thành công (Đơn hàng #' || $1 || ')'
             FROM HopThuoc
             WHERE don_hang_id = $1`,
            Number(orderId)
        );

        await prisma.$executeRawUnsafe(
            `UPDATE HopThuoc SET trang_thai = 'DaBan' WHERE don_hang_id = $1`,
            Number(orderId)
        );
    } catch (e) {
        console.error('[confirmReceipt] update vanchuyen or LichSuPhanPhoi error:', e.message);
    }

    return serializeBigInt(updated);
};

export { processCheckout, cancelUserOrder, fetchUserOrders, fetchUserOrderDetail, confirmReceipt };
