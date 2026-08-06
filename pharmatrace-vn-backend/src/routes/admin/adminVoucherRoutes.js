import express from 'express';
import { getVouchers, createVoucher, deleteVoucher } from '../../controllers/admin/adminVoucherCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Vouchers
 *     description: Voucher code management (For SuperAdmin and Sales staff)
 */

// Authorization: Must be logged in with SuperAdmin or Sales role
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang'));

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Get list of all voucher codes
 *     tags:
 *       - Admin - Vouchers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the list of voucher codes successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   ma_code: "WELCOME2024"
 *                   loai_giam_gia: "PhanTram"
 *                   gia_tri: "10.00"
 *                   don_hang_toi_thieu: "200000.00"
 *                   ngay_bat_dau: "2025-01-01T00:00:00.000Z"
 *                   ngay_ket_thuc: "2030-12-31T23:59:59.000Z"
 *                   so_luong_gioi_han: 100
 *                   so_luong_da_dung: 15
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', getVouchers);

/**
 * @swagger
 * /admin/vouchers/add:
 *   post:
 *     summary: Create a new voucher code
 *     tags:
 *       - Admin - Vouchers
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
 *               - loai_giam_gia
 *               - gia_tri
 *               - ngay_bat_dau
 *               - ngay_ket_thuc
 *             properties:
 *               ma_code:
 *                 type: string
 *                 example: "SUMMER50K"
 *                 description: Voucher code (no spaces or special characters)
 *               loai_giam_gia:
 *                 type: string
 *                 enum: [PhanTram, TienMat]
 *                 example: "TienMat"
 *                 description: Discount type
 *               gia_tri:
 *                 type: number
 *                 example: 50000
 *                 description: Discount value (e.g., 50000 VND or 10%)
 *               don_hang_toi_thieu:
 *                 type: number
 *                 example: 300000
 *                 description: Minimum order value to apply the voucher (default is 0)
 *               ngay_bat_dau:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-01T00:00:00Z"
 *               ngay_ket_thuc:
 *                 type: string
 *                 format: date-time
 *                 example: "2030-06-30T23:59:59Z"
 *               so_luong_gioi_han:
 *                 type: integer
 *                 example: 100
 *                 description: Total number of times the voucher can be used (Leave blank if no limit)
 *     responses:
 *       201:
 *         description: Create voucher successfully
 *       400:
 *         description: Missing information, start date is later than end date, or duplicate voucher code (Unique Constraint Error)
 */
router.post('/add', createVoucher);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   delete:
 *     summary: Delete a voucher code (Hard delete)
 *     tags:
 *       - Admin - Vouchers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the voucher code to delete
 *     responses:
 *       200:
 *         description: Delete voucher successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Voucher deleted successfully!"
 *       404:
 *         description: Voucher not found
 */
router.delete('/:id', deleteVoucher);

export default router;