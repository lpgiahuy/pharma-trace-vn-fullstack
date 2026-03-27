import * as adminOrderModel from '../../models/admin/adminOrderModel.js';

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
        trang_thai_moi: 'DangGiao'
    };
};

export { fetchOrders, fetchOrderDetail, processOrderFulfillment }