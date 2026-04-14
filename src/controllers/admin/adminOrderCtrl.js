import * as adminOrderService from '../../services/admin/adminOrderService.js';

const getOrders = async (req, res, next) => {
    try {
        const data = await adminOrderService.fetchOrders();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const data = await adminOrderService.fetchOrderDetail(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

// API: employee (admin/sales/warehouse) calls this to fulfill the order by providing array of medicine box UIDs to be packed into this order
const fulfillOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { mang_uid } = req.body;

        const data = await adminOrderService.processOrderFulfillment(orderId, mang_uid);

        res.status(200).json({
            success: true,
            message: 'Order packed successfully. Status updated to "Shipping"',
            data: data
        });
    } catch (error) {
        // procedure will throw error if any of the provided UIDs do not exist in inventory or are already assigned to another order
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400); 
        next(error);
    }
};

// API: Confirm delivery completed — changes status from DangGiao → HoanThanh
// COD orders will also auto-update payment status to DaThanhToan
const confirmOrderDelivery = async (req, res, next) => {
    try {
        const data = await adminOrderService.confirmDelivery(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được xác nhận hoàn thành.',
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

// API: Update payment status (manual admin or VNPay/MoMo webhook callback)
const updateOrderPayment = async (req, res, next) => {
    try {
        const { trang_thai_thanh_toan, ma_giao_dich_ngan_hang } = req.body;
        if (!trang_thai_thanh_toan) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trang_thai_thanh_toan.' });
        }
        const data = await adminOrderService.processPaymentUpdate(req.params.id, trang_thai_thanh_toan, ma_giao_dich_ngan_hang);
        res.status(200).json({
            success: true,
            message: `Trạng thái thanh toán đã cập nhật: ${trang_thai_thanh_toan}`,
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getOrders, getOrderById, fulfillOrder, confirmOrderDelivery, updateOrderPayment };