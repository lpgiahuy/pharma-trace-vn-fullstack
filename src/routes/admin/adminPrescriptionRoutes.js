import express from 'express';
import { getList, updateStatus } from '../../controllers/admin/adminPrescriptionCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Prescriptions
 *     description: Manage and review customer-uploaded prescriptions (for Pharmacists, Admins, and Sales staff)
 */

// SECURITY: Must be logged in with Pharmacist, Admin, or Sales role to view and approve prescriptions
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang'));

/**
 * @swagger
 * /admin/prescriptions:
 *   get:
 *     summary: Get list of prescriptions
 *     description: Requires Token (SuperAdmin, DuocSi, BanHang). Returns prescriptions with customer info. Supports filtering by approval status.
 *     tags:
 *       - Admin - Prescriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ChoDuyet, HopLe, TuChoi]
 *         description: Filter by status (leave empty to retrieve all)
 *     responses:
 *       200:
 *         description: Successfully retrieved list
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   hinh_anh_toa: "/uploads/1711440000000-toathuoc.jpg"
 *                   ten_bac_si: "Bs. Nguyễn Văn A"
 *                   ten_benh_vien: "Bệnh viện Chợ Rẫy"
 *                   chuan_doan: "Viêm họng cấp"
 *                   ngay_tao: "2024-03-26T10:00:00.000Z"
 *                   trang_thai_duyet: "ChoDuyet"
 *                   ten_khach_hang: "Nguyễn Văn Khách"
 *                   so_dien_thoai: "0901234567"
 *       401:
 *         description: Not logged in or token expired
 *       403:
 *         description: Access denied (invalid role)
 */
router.get('/', getList);

/**
 * @swagger
 * /admin/prescriptions/{id}/status:
 *   put:
 *     summary: Review a prescription (Approve / Reject)
 *     description: Requires Token (SuperAdmin, DuocSi, BanHang). Pharmacist reviews the prescription image and approves or rejects it.
 *     tags:
 *       - Admin - Prescriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the prescription to review
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
 *                 enum: [ChoDuyet, HopLe, TuChoi]
 *                 example: "HopLe"
 *                 description: New approval status
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Prescription updated successfully: HopLe"
 *               data:
 *                 id: 1
 *                 trang_thai_duyet: "HopLe"
 *       400:
 *         description: Invalid status value provided
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Invalid status! Accepted values: ChoDuyet, HopLe, TuChoi."
 *       404:
 *         description: Prescription not found
 */
router.put('/:id/status', updateStatus);

export default router;