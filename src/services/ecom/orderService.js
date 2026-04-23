import * as orderModel from '../../models/ecom/orderModel.js';
import * as cartModel from '../../models/ecom/cartModel.js';
import * as productModel from '../../models/ecom/productModel.js';
import * as inventoryModel from '../../models/pharma/inventoryModel.js';

const processCheckout = async (userId, payload) => {
    const { dia_chi_giao_hang, phuong_thuc_thanh_toan, ma_giam_gia, diem_su_dung, lat, lng } = payload;

    // 1. Lấy items trong giỏ hàng
    const cartItems = await cartModel.getCartItems(userId);
    if (cartItems.length === 0) {
        const error = new Error('Giỏ hàng của bạn đang trống!');
        error.statusCode = 400;
        throw error;
    }

    // 2. Kiểm tra tồn kho (Logic 1-1: 1 sản phẩm đặt = 1 đơn vị kho)
    // Bước này giúp báo lỗi "đẹp" cho Frontend trước khi gọi vào Database
    for (const item of cartItems) {
        const totalStock = await inventoryModel.getTotalProductStock(item.duoc_pham_id);

        // SỬA TẠI ĐÂY: Không còn nhân he_so_quy_doi nữa
        const requiredUnits = item.so_luong;

        if (totalStock < requiredUnits) {
            const error = new Error(`Sản phẩm "${item.ten_thuoc}" không đủ hàng. (Kho còn: ${totalStock})`);
            error.statusCode = 400;
            throw error;
        }
    }

    // 3. Tính phí ship dựa trên kho gần nhất còn hàng
    let phiShip = 30000; // Giá trị mặc định
    let nearestStoreId = null;

    if (lat && lng) {
        // Lấy sản phẩm đầu tiên làm căn cứ tìm kho gần nhất
        const nearestStore = await productModel.getNearestPharmacy(cartItems[0].duoc_pham_id, lat, lng);
        if (nearestStore) {
            phiShip = await orderModel.getShippingFee(nearestStore.khoang_cach);
            nearestStoreId = nearestStore.don_vi_id;
        }
    }

    const voucher = ma_giam_gia || null;
    const points = diem_su_dung ? parseInt(diem_su_dung) : 0;

    // 4. Tạo đơn hàng qua Procedure
    // Procedure này sẽ: Tạo đơn -> Copy items -> Trigger SQL tự trừ kho -> Tự trừ điểm
    const newOrder = await orderModel.callCheckoutProcedure(
        userId,
        dia_chi_giao_hang,
        phuong_thuc_thanh_toan,
        voucher,
        points,
        phiShip, // Đảm bảo truyền đủ tham số thứ 6
        nearestStoreId // Thêm don_vi_xuat_id
    );

    // 5. Tích điểm thưởng 0.5% dựa trên tổng tiền thực tế
    if (newOrder) {
        newOrder.rewardInfo = await orderModel.addLoyaltyPoints(userId, newOrder.tong_tien);
    }

    return newOrder;
};

const cancelUserOrder = async (orderId, userId) => {
    try {
        await orderModel.cancelOrder(orderId, userId);
        return { don_hang_id: orderId, trang_thai_moi: 'DaHuy' };
    } catch (err) {
        // Procedure sẽ RAISE EXCEPTION nếu đơn không ở trạng thái 'ChoXacNhan'
        const error = new Error(err.message || 'Không thể hủy đơn hàng này.');
        error.statusCode = 400;
        throw error;
    }
};

const fetchUserOrders = async (userId) => {
    return await orderModel.getOrdersByUserId(userId);
};

const fetchUserOrderDetail = async (orderId, userId) => {
    return await orderModel.getOrderDetailById(orderId, userId);
};

export { processCheckout, cancelUserOrder, fetchUserOrders, fetchUserOrderDetail };