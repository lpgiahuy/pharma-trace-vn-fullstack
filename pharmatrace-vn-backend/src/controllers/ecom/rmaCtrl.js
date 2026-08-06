import * as rmaModel from '../../models/ecom/rmaModel.js';
import pool from '../../config/db.js';

const submitRmaRequest = async (req, res, next) => {
    try {
        const { don_hang_id, ly_do_tra } = req.body;

        if (!don_hang_id || !ly_do_tra) {
            return res.status(400).json({ success: false, message: 'Order ID and return reason are required!' });
        }

        const checkOrder = await pool.query(`SELECT trang_thai_don, khach_hang_id FROM DonHang WHERE id = $1`, [don_hang_id]);
        
        if (checkOrder.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Order does not exist!' });
        }
        
        const order = checkOrder.rows[0];
        if (order.khach_hang_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not allowed to return another user\'s order!' });
        }
        
        if (order.trang_thai_don !== 'HoanThanh') {
            return res.status(400).json({ success: false, message: `Return not allowed! Current order status is '${order.trang_thai_don}'. The order must be delivered before requesting a return.` });
        }

        // check if there's already an RMA request for this order
        const checkExistingRMA = await pool.query(
            `SELECT id, trang_thai_duyet FROM PhieuTraHang WHERE don_hang_id = $1`, 
            [don_hang_id]
        );

        if (checkExistingRMA.rowCount > 0) {
            const currentStatus = checkExistingRMA.rows[0].trang_thai_duyet;
            return res.status(400).json({ 
                success: false, 
                message: `Order has an existing return request with status: ${currentStatus}. You cannot submit another request!` 
            });
        }

        
        const data = await rmaModel.createRmaRequest(req.user.id, don_hang_id, ly_do_tra);
        res.status(201).json({ success: true, message: 'Return request submitted successfully. Please wait for customer support to contact you.', data });
    } catch (error) { next(error); }
};

export { submitRmaRequest };