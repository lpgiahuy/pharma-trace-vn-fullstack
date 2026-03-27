import express from 'express';
import { checkoutOrder } from '../../controllers/ecom/orderController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Orders
 *     description: Order management and checkout (Requires authentication)
 */

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout and place order from current cart
 *     tags: [E-com - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dia_chi_giao_hang
 *               - phuong_thuc_thanh_toan
 *             properties:
 *               dia_chi_giao_hang:
 *                 type: string
 *                 example: "123 Nguyen Hue Street, District 1, Ho Chi Minh City"
 *                 description: Delivery address of the customer
 *               phuong_thuc_thanh_toan:
 *                 type: string
 *                 enum: [COD, VNPAY, MOMO]
 *                 example: "COD"
 *                 description: Payment method
 *               ghi_chu:
 *                 type: string
 *                 example: "Please deliver during business hours"
 *                 description: Note for the shipper or pharmacy (Optional)
 *               voucher_id:
 *                 type: integer
 *                 example: 5
 *                 description: Voucher ID if customer uses a discount code (Optional)
 *     responses:
 *       200:
 *         description: Order placed successfully, returns order code
 *       400:
 *         description: Cart is empty or payment information is invalid
 *       401:
 *         description: Authentication error - Not logged in or token expired
 */
router.post('/checkout', protect, checkoutOrder);

export default router;