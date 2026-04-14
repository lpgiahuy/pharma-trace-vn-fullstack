import * as orderService from '../../services/ecom/orderService.js';

export const checkoutOrder = async (req, res, next) => {
    try {
        const { dia_chi_giao_hang, lat, lng } = req.body;
        if (!dia_chi_giao_hang || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Thiếu địa chỉ hoặc tọa độ vị trí.' });
        }

        const order = await orderService.processCheckout(req.user.id, req.body);
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const data = await orderService.fetchUserOrders(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

export const getMyOrderDetail = async (req, res, next) => {
    try {
        const data = await orderService.fetchUserOrderDetail(req.params.id, req.user.id);
        if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

export const cancelMyOrder = async (req, res, next) => {
    try {
        const data = await orderService.cancelUserOrder(req.params.id, req.user.id);
        res.status(200).json({ success: true, message: 'Đơn hàng đã được hủy thành công.', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};