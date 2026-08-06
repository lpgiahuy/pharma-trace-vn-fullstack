import pool from '../../config/db.js';
import * as orderModel from '../../models/ecom/orderModel.js';
import * as cartModel from '../../models/ecom/cartModel.js';
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

    // Acquire a client from the pool to manage the transaction
    const client = await pool.connect();
    let cartItems = [];

    try {
        // Start the transaction
        await client.query('BEGIN');

        // 1. Get cart items
        cartItems = await cartModel.getCartItems(userId);
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

        // 4. Find a pharmacy that can fulfill ALL items in the cart
        let phiShip = 30000;
        let nearestStoreId = null;

        // Try to find a store that has everything
        const storeWithAll = await productModel.findStoreWithAllItems(cartItems);
        
        if (storeWithAll) {
            nearestStoreId = storeWithAll.don_vi_id;
            // If we have coordinates, calculate real shipping fee from this store
            if (lat && lng) {
                const distanceRes = await client.query(
                    'SELECT fn_tinh_khoang_cach_km($1, $2, toa_do_lat, toa_do_lng) AS km FROM DonVi WHERE id = $3',
                    [lat, lng, nearestStoreId]
                );
                if (distanceRes.rows[0]?.km) {
                    phiShip = await orderModel.getShippingFee(distanceRes.rows[0].km);
                }
            }
        } else {
            // Fallback if no single store has everything: 
            // Pick any store for now (the procedure will still fail deduction later, but this is better than NULL)
            const fallbackStore = await productModel.getNearestPharmacy(cartItems[0].duoc_pham_id, lat, lng, cartItems[0].so_luong);
            nearestStoreId = fallbackStore?.don_vi_id || null;
            
            if (!nearestStoreId) {
                const anyStoreRes = await client.query("SELECT id FROM DonVi WHERE loai_don_vi = 'NhaThuoc' LIMIT 1");
                nearestStoreId = anyStoreRes.rows[0]?.id;
            }
        }

        const points = diem_su_dung ? parseInt(diem_su_dung) : 0;

        // 5. Create the order using the stored procedure (Passing the client to stay in transaction)
        // This procedure handles creating the order, items, and deducting stock via trigger.
        const newOrder = await orderModel.callCheckoutProcedure(
            userId,
            dia_chi_giao_hang,
            phuong_thuc_thanh_toan,
            dbVoucher,
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
        
        // Translate database trigger error for frontend user
        if (error.message && error.message.includes('không đủ số lượng cho sản phẩm')) {
            const match = error.message.match(/sản phẩm \(ID: (\d+)\)/);
            if (match) {
                const pId = match[1];
                const pName = cartItems.find(i => i.duoc_pham_id == pId)?.ten_thuoc || `ID ${pId}`;
                error.message = `Xin lỗi, sản phẩm "${pName}" không đủ số lượng tại một chi nhánh duy nhất để giao hàng. Vui lòng giảm số lượng.`;
            } else {
                error.message = 'Xin lỗi, một số sản phẩm trong giỏ không đủ tồn kho tại cùng một chi nhánh để giao hàng.';
            }
        }

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