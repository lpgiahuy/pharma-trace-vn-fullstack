import express from 'express';
import { getOrders, getOrderById, fulfillOrder } from '../../controllers/admin/adminOrderCtrl.js';
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

export default router;