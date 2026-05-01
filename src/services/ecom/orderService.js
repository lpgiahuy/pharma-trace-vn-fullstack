import pool from '../../config/db.js';
import * as orderModel from '../../models/ecom/orderModel.js';
import * as cartModel from '../../models/ecom/cartModel.js';
import * as productModel from '../../models/ecom/productModel.js';

const processCheckout = async (userId, payload) => {
    const { dia_chi_giao_hang, phuong_thuc_thanh_toan, ma_giam_gia, diem_su_dung, lat, lng } = payload;

    // Acquire a client from the pool to manage the transaction
    const client = await pool.connect();

    try {
        // Start the transaction
        await client.query('BEGIN');

        // 1. Get cart items
        const cartItems = await cartModel.getCartItems(userId);
        if (cartItems.length === 0) {
            const error = new Error('Your cart is empty!');
            error.statusCode = 400;
            throw error;
        }

        // 2. Critical: Lock Inventory rows for all products in the cart to prevent race conditions
        // This ensures no other transaction can modify these products' stock until we are done.
        const productIds = cartItems.map(item => item.duoc_pham_id);
        await client.query(
            'SELECT 1 FROM TonKho WHERE duoc_pham_id = ANY($1) FOR UPDATE',
            [productIds]
        );

        // 3. Check inventory within the transaction
        for (const item of cartItems) {
            const res = await client.query(
                'SELECT COALESCE(SUM(so_luong_ton), 0) AS total_stock FROM TonKho WHERE duoc_pham_id = $1',
                [item.duoc_pham_id]
            );
            const totalStock = parseInt(res.rows[0].total_stock);

            if (totalStock < item.so_luong) {
                const error = new Error(`Product "${item.ten_thuoc}" is out of stock. (Available: ${totalStock})`);
                error.statusCode = 400;
                throw error;
            }
        }

        // 4. Calculate shipping fee (Read-only logic)
        let phiShip = 30000;
        let nearestStoreId = null;
        if (lat && lng) {
            const nearestStore = await productModel.getNearestPharmacy(cartItems[0].duoc_pham_id, lat, lng);
            if (nearestStore) {
                phiShip = await orderModel.getShippingFee(nearestStore.khoang_cach);
                nearestStoreId = nearestStore.don_vi_id;
            }
        }

        const voucher = ma_giam_gia || null;
        const points = diem_su_dung ? parseInt(diem_su_dung) : 0;

        // 5. Create the order using the stored procedure (Passing the client to stay in transaction)
        // This procedure handles creating the order, items, and deducting stock via trigger.
        const newOrder = await orderModel.callCheckoutProcedure(
            userId,
            dia_chi_giao_hang,
            phuong_thuc_thanh_toan,
            voucher,
            points,
            phiShip,
            nearestStoreId,
            client
        );

        // 6. Handle reward points inside the transaction
        if (newOrder) {
            const pointsToEarn = Math.floor(newOrder.tong_tien * 0.005);
            const rewardRes = await client.query(
                `UPDATE KhachHang SET diem_tich_luy = diem_tich_luy + $2 WHERE id = $1 RETURNING diem_tich_luy, hang_thanh_vien`,
                [userId, pointsToEarn]
            );
            newOrder.rewardInfo = {
                pointsEarned: pointsToEarn,
                newTotalPoints: rewardRes.rows[0].diem_tich_luy,
                newTier: rewardRes.rows[0].hang_thanh_vien
            };
        }

        // Commit all changes
        await client.query('COMMIT');
        return newOrder;

    } catch (error) {
        // Rollback on any failure to maintain data integrity
        await client.query('ROLLBACK');
        if (!error.statusCode) error.statusCode = 400;
        throw error;
    } finally {
        // Always release the client back to the pool
        client.release();
    }
};

const cancelUserOrder = async (orderId, userId) => {
    try {
        await orderModel.cancelOrder(orderId, userId);
        return { don_hang_id: orderId, trang_thai_moi: 'Cancelled' };
    } catch (err) {
        const error = new Error(err.message || 'Cannot cancel this order.');
        error.statusCode = 400;
        throw error;
    }
};

const fetchUserOrders = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return await orderModel.getOrdersByUserId(userId, limit, offset);
};

const fetchUserOrderDetail = async (orderId, userId) => {
    return await orderModel.getOrderDetailById(orderId, userId);
};

export { processCheckout, cancelUserOrder, fetchUserOrders, fetchUserOrderDetail };