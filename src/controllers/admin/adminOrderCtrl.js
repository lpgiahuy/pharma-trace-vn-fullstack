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

export { getOrders, getOrderById, fulfillOrder };