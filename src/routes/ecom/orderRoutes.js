import express from 'express';
import { checkoutOrder, getMyOrders, getMyOrderDetail, cancelMyOrder } from '../../controllers/ecom/orderController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { checkoutLimiter } from '../../middlewares/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Orders
 *     description: Order management and payment (Login required)
 */

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout and place order from current cart
 *     description: Finalize the order, apply loyalty points/voucher, automatically calculate shipping fee based on distance and deduct inventory.
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
 *                 example: "1 Vo Van Ngan Street, Linh Chieu, Thu Duc"
 *                 description: Customer's delivery address.
 *               phuong_thuc_thanh_toan:
 *                 type: string
 *                 enum: [COD, VNPAY, MOMO, ChuyenKhoan]
 *                 example: "COD"
 *                 description: Payment method chosen by the customer.
 *               ma_giam_gia:
 *                 type: string
 *                 example: "PHARMA2026"
 *                 description: Discount code (if any).
 *               diem_su_dung:
 *                 type: integer
 *                 example: 10
 *                 description: Number of points to use (1 point = 1000 VND).
 *               lat:
 *                 type: number
 *                 example: 10.841
 *                 description: Latitude coordinate to calculate shipping fee.
 *               lng:
 *                 type: number
 *                 example: 106.759
 *                 description: Longitude coordinate to calculate shipping fee.
 *     responses:
 *       201:
 *         description: Order placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                   example: true
 *                 message: 
 *                   type: string
 *                   example: "Order placed successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: 
 *                       type: integer
 *                       example: 50
 *                     tong_tien: 
 *                       type: number
 *                       example: 800
 *                     phi_van_chuyen: 
 *                       type: number
 *                       example: 30000
 *                     diem_su_dung: 
 *                       type: integer
 *                       example: 10
 *                     tien_giam_tu_diem: 
 *                       type: number
 *                       example: 10000
 *                     rewardInfo:
 *                       type: object
 *                       properties:
 *                         pointsEarned:
 *                           type: integer
 *                           example: 7500
 *                         newTotalPoints:
 *                           type: integer
 *                           example: 12000
 *                         newTier:
 *                           type: string
 *                           example: "Kim Cương"
 *       400:
 *         description: Error (Out of stock, empty cart, or invalid coordinates).
 */
router.post('/checkout', protect, checkoutLimiter, checkoutOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get my order history
 *     description: Returns a summary list of orders placed by the customer, sorted from newest to oldest.
 *     tags: [E-com - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retrieved order list successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: 
 *                         type: integer
 *                         example: 50
 *                       ngay_dat_hang: 
 *                         type: string
 *                         format: date-time
 *                       tong_tien: 
 *                         type: number
 *                         example: 450000
 *                       trang_thai: 
 *                         type: string
 *                         example: "ChoXacNhan"
 *                       items_count: 
 *                         type: integer
 *                         example: 2
 */
router.get('/my-orders', protect, getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: View details of a specific order
 *     description: Returns full order information including list of purchased medicines, unit price, quantity and shipping details.
 *     tags: [E-com - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to view.
 *     responses:
 *       200:
 *         description: Order details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: 
 *                       type: integer
 *                     dia_chi_giao_hang: 
 *                       type: string
 *                     tong_tien: 
 *                       type: number
 *                     trang_thai: 
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ten_thuoc: 
 *                             type: string
 *                           so_luong: 
 *                             type: integer
 *                           don_gia: 
 *                             type: number
 *                           ten_don_vi: 
 *                             type: string
 *       404:
 *         description: Order not found or you do not have permission to view this order.
 */
router.get('/:id', protect, getMyOrderDetail);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   delete:
 *     summary: Hủy đơn hàng (chỉ khi đang chờ xác nhận)
 *     description: Khách hàng hủy đơn hàng của mình. Chỉ cho phép hủy khi đơn đang ở trạng thái `ChoXacNhan`. Các trạng thái khác sẽ bị từ chối.
 *     tags: [E-com - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng cần hủy.
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đơn hàng đã được hủy thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     don_hang_id:
 *                       type: integer
 *                       example: 42
 *                     trang_thai_moi:
 *                       type: string
 *                       example: "DaHuy"
 *       400:
 *         description: Không thể hủy (đơn đang giao, đã hoàn thành, hoặc đã hủy trước đó).
 *       404:
 *         description: Không tìm thấy đơn hàng.
 */
router.delete('/:id/cancel', protect, cancelMyOrder);

export default router;