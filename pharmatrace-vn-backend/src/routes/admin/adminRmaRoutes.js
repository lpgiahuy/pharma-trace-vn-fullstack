import express from 'express';
import { getRmaList, approveRma } from '../../controllers/admin/adminRmaCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - RMA
 *     description: Manage and review customer return/refund requests
 */

// Require authentication and role-based authorization (Admin, Sales, Accountant)
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang'));

/**
 * @swagger
 * /admin/rma:
 *   get:
 *     summary: Get all return requests
 *     description: Requires token (SuperAdmin, BanHang, KeToan). Returns a list of RMA requests along with basic customer information.
 *     tags:
 *       - Admin - RMA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the list
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   don_hang_id: 101
 *                   khach_hang_id: 5
 *                   ly_do_tra: "Product was damaged during shipping"
 *                   trang_thai_duyet: "ChoDuyet"
 *                   ngay_yeu_cau: "2024-03-24T10:00:00.000Z"
 *                   ho_ten: "Nguyen Van Khach"
 *                   so_dien_thoai: "0901234567"
 *       403:
 *         description: Forbidden - Access denied
 */
router.get('/', getRmaList);

/**
 * @swagger
 * /admin/rma/{id}/status:
 *   put:
 *     summary: Approve or reject a return request
 *     description: Requires token (SuperAdmin, BanHang, KeToan). The accountant or customer service staff updates the status after resolving the case with the customer.
 *     tags:
 *       - Admin - RMA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the return request (PhieuTraHang)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai_duyet
 *             properties:
 *               trang_thai_duyet:
 *                 type: string
 *                 enum: [DaHoanTien, TuChoi]
 *                 example: "DaDuyet"
 *                 description: Update status to refunded or rejected
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Return request status updated: DaHoanTien"
 *               data:
 *                 id: 1
 *                 trang_thai_duyet: "DaHoanTien"
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Return request not found
 */
router.put('/:id/status', approveRma);

export default router;