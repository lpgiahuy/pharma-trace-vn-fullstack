import * as orderService from '../../services/ecom/orderService.js';

export const checkoutOrder = async (req, res, next) => {
    try {
        const { dia_chi_giao_hang, lat, lng } = req.body;
        if (!dia_chi_giao_hang || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Missing delivery address or coordinates.' });
        }

        const order = await orderService.processCheckout(req.user.id, req.body);
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const data = await orderService.fetchUserOrders(req.user.id, parseInt(page), parseInt(limit));
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export const getMyOrderDetail = async (req, res, next) => {
    try {
        const data = await orderService.fetchUserOrderDetail(req.params.id, req.user.id);
        if (!data) return res.status(404).json({ success: false, message: 'Order not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export const cancelMyOrder = async (req, res, next) => {
    try {
        const data = await orderService.cancelUserOrder(req.params.id, req.user.id);
        res.status(200).json({ success: true, message: 'Order cancelled successfully.', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};