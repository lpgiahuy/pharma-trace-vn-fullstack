import * as adminOrderModel from '../../models/admin/adminOrderModel.js';

const VALID_PAYMENT_STATUSES = ['ChuaThanhToan', 'DaThanhToan', 'HoanTien', 'ThanhToanLoi'];

const fetchOrders = async () => {
    return await adminOrderModel.getAllOrders();
};

const fetchOrderDetail = async (orderId) => {
    const order = await adminOrderModel.getOrderDetail(orderId);
    if (!order) {
        const error = new Error('Order not found!');
        error.statusCode = 404;
        throw error;
    }
    return order;
};

const processOrderFulfillment = async (orderId, mang_uid) => {
    // check uids
    if (!Array.isArray(mang_uid) || mang_uid.length === 0) {
        const error = new Error('Please provide a list of QR codes (UIDs) for the medicine boxes to be packed.');
        error.statusCode = 400;
        throw error;
    }

    // check if order exists and is in correct status to be fulfilled
    const order = await adminOrderModel.getOrderDetail(orderId);
    if (!order) {
        const error = new Error('Order not found!');
        error.statusCode = 404;
        throw error;
    }
    if (order.trang_thai_don !== 'ChoXacNhan' && order.trang_thai_don !== 'DaĐongGoi') {
        const error = new Error(`Unable to pack the order. Current status: {status}: ${order.trang_thai_don}`);
        error.statusCode = 400;
        throw error;
    }

    // call procedure to pack order with provided UIDs
    await adminOrderModel.packOrderWithUIDs(orderId, mang_uid);

    return {
        don_hang_id: orderId,
        so_luong_hop_thuoc_da_gan: mang_uid.length,
        trang_thai_moi: 'DaDongGoi'
    };
};

const shipOrder = async (orderId) => {
    const order = await adminOrderModel.getOrderDetail(orderId);
    if (!order) {
        const error = new Error('Order not found!');
        error.statusCode = 404;
        throw error;
    }

    if (order.trang_thai_don !== 'DaDongGoi') {
        const error = new Error(`Không thể bắt đầu giao hàng. Đơn hàng đang ở trạng thái: "${order.trang_thai_don}". Chỉ đơn "DaDongGoi" mới được chuyển sang giao hàng.`);
        error.statusCode = 400;
        throw error;
    }

    await adminOrderModel.startShippingOrder(orderId);

    return {
        don_hang_id: orderId,
        trang_thai_moi: 'DangGiao'
    };
};

// Confirm delivery: DangGiao → HoanThanh
// The stored procedure sp_hoan_thanh_don_hang now handles:
// 1. Updating status to HoanThanh
// 2. Updating payment status to DaThanhToan
// 3. Updating medicine boxes status to DaBan
// 4. Adding loyalty points to customer
// 5. Updating product sales statistics
const confirmDelivery = async (orderId) => {
    const order = await adminOrderModel.getOrderDetail(orderId);
    if (!order) {
        const error = new Error('Order not found!');
        error.statusCode = 404;
        throw error;
    }
    if (order.trang_thai_don !== 'DangGiao') {
        const error = new Error(`Không thể hoàn thành. Đơn hàng đang ở trạng thái: "${order.trang_thai_don}". Chỉ đơn "DangGiao" mới được xác nhận hoàn thành.`);
        error.statusCode = 400;
        throw error;
    }

    const updated = await adminOrderModel.completeOrder(orderId);
    return updated;
};

// Update payment status (Manual admin update or webhook callback)
const processPaymentUpdate = async (orderId, trang_thai_thanh_toan, ma_giao_dich) => {
    if (!VALID_PAYMENT_STATUSES.includes(trang_thai_thanh_toan)) {
        const error = new Error(`Trạng thái thanh toán không hợp lệ. Các giá trị được phép: ${VALID_PAYMENT_STATUSES.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    const order = await adminOrderModel.getOrderDetail(orderId);
    if (!order) {
        const error = new Error('Order not found!');
        error.statusCode = 404;
        throw error;
    }

    // Không cho cập nhật đơn đã hủy
    if (order.trang_thai_don === 'DaHuy') {
        const error = new Error('Không thể cập nhật thanh toán cho đơn hàng đã hủy.');
        error.statusCode = 400;
        throw error;
    }

    const updated = await adminOrderModel.updatePaymentStatus(orderId, trang_thai_thanh_toan, ma_giao_dich);
    return updated;
};

export { fetchOrders, fetchOrderDetail, processOrderFulfillment, shipOrder, confirmDelivery, processPaymentUpdate }