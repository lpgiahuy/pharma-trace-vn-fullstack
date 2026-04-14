import express from 'express';
import { getOrders, getOrderById, fulfillOrder, confirmOrderDelivery, updateOrderPayment } from '../../controllers/admin/adminOrderCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Orders
 *     description: Order management and order fulfillment (For Admin / Sales / Warehouse staff)
 */

// Security: All order operations require authentication and specific role permissions
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'BanHang', 'QuanLyKho'));

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get list of all orders in the system
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully returned list of orders with customer information
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: 
 *                 - id: 1
 *                   ho_ten: "Nguyễn Văn A"
 *                   tong_tien: 150000
 *                   trang_thai_don: "ChoXacNhan"
 */
router.get('/', getOrders);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get detailed information of a specific order (including ordered medicines)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details and array of order items
 *       404:
 *         description: Order not found
 */
router.get('/:id', getOrderById);

/**
 * @swagger
 * /admin/orders/{id}/fulfill:
 *   post:
 *     summary: Fulfill and pack an order (Assign actual QR/UID codes to the order)
 *     description: Warehouse staff scans QR codes on each medicine box and submits the list of UIDs to complete the packing process.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to fulfill
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mang_uid
 *             properties:
 *               mang_uid:
 *                 type: array
 *                 description: Array of UID (UUID) codes of the scanned medicine boxes
 *                 items:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Order fulfilled successfully. Order status changed to 'DangGiao' (Shipping)
 *       400:
 *         description: Order is not in pending status or UID is invalid/not available in inventory
 *       404:
 *         description: Order not found
 */
router.post('/:id/fulfill', fulfillOrder);

/**
 * @swagger
 * /admin/orders/{id}/complete:
 *   patch:
 *     summary: Xác nhận giao hàng thành công (DangGiao → HoanThanh)
 *     description: |
 *       Nhân viên xác nhận đơn hàng đã được giao thành công.
 *       Đơn hàng sẽ chuyển sang trạng thái `HoanThanh`.
 *       Nếu phương thức thanh toán là COD, hệ thống sẽ tự động cập nhật trạng thái thanh toán thành `DaThanhToan`.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Xác nhận hoàn thành thành công
 *       400:
 *         description: Đơn hàng không ở trạng thái DangGiao
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.patch('/:id/complete', confirmOrderDelivery);

/**
 * @swagger
 * /admin/orders/{id}/payment:
 *   patch:
 *     summary: Cập nhật trạng thái thanh toán đơn hàng
 *     description: |
 *       Admin hoặc Webhook từ cổng thanh toán (VNPay, MoMo) gọi endpoint này để cập nhật trạng thái thanh toán.
 *       Có thể kèm theo mã giao dịch ngân hàng để đối soát.
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai_thanh_toan
 *             properties:
 *               trang_thai_thanh_toan:
 *                 type: string
 *                 enum: [ChuaThanhToan, DaThanhToan, HoanTien, ThanhToanLoi]
 *                 example: "DaThanhToan"
 *               ma_giao_dich_ngan_hang:
 *                 type: string
 *                 example: "VNPAY20260414123456"
 *                 description: Mã giao dịch từ cổng thanh toán (tùy chọn)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Trạng thái không hợp lệ hoặc đơn hàng đã hủy
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.patch('/:id/payment', updateOrderPayment);

export default router;