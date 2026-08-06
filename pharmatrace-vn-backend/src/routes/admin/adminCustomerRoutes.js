import express from 'express';
import { getCustomers, getCustomerById, updateCustomerStatus } from '../../controllers/admin/adminCustomerCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Customers
 *     description: Customer account management (SuperAdmin only)
 */

router.use(protect);
router.use(authorizeRoles('SuperAdmin'));

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách toàn bộ khách hàng
 *     description: Trả về danh sách tất cả khách hàng kèm hạng thành viên và trạng thái tài khoản.
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khách hàng
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   ho_ten: "Nguyễn Văn A"
 *                   so_dien_thoai: "0901234567"
 *                   hang_thanh_vien: "Vàng"
 *                   diem_tich_luy: 2500
 *                   trang_thai: true
 */
router.get('/', getCustomers);

/**
 * @swagger
 * /admin/customers/{id}:
 *   get:
 *     summary: Xem chi tiết khách hàng (kèm thống kê đơn hàng)
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID khách hàng
 *     responses:
 *       200:
 *         description: Thông tin khách hàng + thống kê đơn hàng
 *       404:
 *         description: Không tìm thấy khách hàng
 */
router.get('/:id', getCustomerById);

/**
 * @swagger
 * /admin/customers/{id}/status:
 *   patch:
 *     summary: Khóa hoặc mở khóa tài khoản khách hàng
 *     description: |
 *       Dùng để khóa tài khoản vi phạm hoặc mở khóa tài khoản đã bị khóa.
 *       - `lock`: Đặt `trang_thai = false` → khách không đăng nhập được
 *       - `unlock`: Đặt `trang_thai = true` → khách đăng nhập bình thường
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID khách hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [lock, unlock]
 *                 example: "lock"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: action không hợp lệ
 *       404:
 *         description: Không tìm thấy khách hàng
 */
router.patch('/:id/status', updateCustomerStatus);

export default router;
