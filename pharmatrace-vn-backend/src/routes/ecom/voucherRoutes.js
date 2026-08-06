import express from 'express';
import { applyVoucher } from '../../controllers/ecom/voucherCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - Vouchers
 *     description: Voucher management and application to shopping cart
 */

/**
 * @swagger
 * /vouchers/apply:
 *   post:
 *     summary: Apply a voucher code to the order
 *     description: Requires customer JWT token. The system will validate expiry date, remaining usage, minimum order value, and calculate the discount amount.
 *     tags: [Ecom - Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ma_code
 *               - tong_tien_don_hang
 *             properties:
 *               ma_code:
 *                 type: string
 *                 example: "WELCOME2024"
 *                 description: Voucher code entered by the customer
 *               tong_tien_don_hang:
 *                 type: number
 *                 example: 250000
 *                 description: Current total order value (used to check voucher conditions)
 *     responses:
 *       200:
 *         description: Voucher applied successfully, returns the discount amount
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Voucher applied successfully!"
 *               data:
 *                 ma_code: "WELCOME2024"
 *                 loai_giam_gia: "PhanTram"
 *                 so_tien_giam: 25000
 *       400:
 *         description: Validation error (expired, not yet active, usage limit reached, or minimum order value not met)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Your order must reach a minimum of 300,000đ to use this voucher!"
 *       401:
 *         description: Not authenticated or token expired
 *       404:
 *         description: Voucher code not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Voucher code does not exist!"
 */
router.post('/apply', protect, applyVoucher);

export default router;