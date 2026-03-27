import express from 'express';
import { submitRmaRequest } from '../../controllers/ecom/rmaCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - RMA
 *     description: Customer Return & Refund Request Management
 */

/**
 * @swagger
 * /rma/request:
 *   post:
 *     summary: Submit a Return Request (RMA)
 *     description: |
 *       Requires a valid customer token.
 *       Customers can only submit return requests for their own orders.
 *       The order must be in "Completed" (Delivered) status.
 *     tags:
 *       - Ecom - RMA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - don_hang_id
 *               - ly_do_tra
 *             properties:
 *               don_hang_id:
 *                 type: integer
 *                 example: 101
 *                 description: ID of the order to request a return for
 *               ly_do_tra:
 *                 type: string
 *                 example: "The product was damaged during shipping, packaging was torn."
 *                 description: Detailed reason for the return request
 *     responses:
 *       201:
 *         description: Return request submitted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Return request submitted successfully. Please wait for customer support to contact you."
 *               data:
 *                 id: 1
 *                 khach_hang_id: 5
 *                 don_hang_id: 101
 *                 ly_do_tra: "The product was damaged..."
 *                 trang_thai_duyet: "ChoDuyet"
 *                 ngay_yeu_cau: "2024-03-24T10:00:00.000Z"
 *       400:
 *         description: Invalid input or order not eligible for return
 *         content:
 *           application/json:
 *             examples:
 *               ChuaHoanThanh:
 *                 value:
 *                   success: false
 *                   message: "Return not allowed! Current order status is 'DangGiao'. The order must be delivered before requesting a return."
 *               ThieuThongTin:
 *                 value:
 *                   success: false
 *                   message: "Order ID and return reason are required!"
 *       401:
 *         description: Unauthorized - Missing or expired token
 *       403:
 *         description: Forbidden - Attempting to access another user's order
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "You are not allowed to return another user's order!"
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Order not found!"
 */
router.post('/request', protect, submitRmaRequest);

export default router;