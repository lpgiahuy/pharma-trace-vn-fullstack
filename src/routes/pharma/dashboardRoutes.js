import express from 'express';
import { getDashboardData, getDashboardStats, getRevenueChart, getTopProducts, getLowStockAlerts } from '../../controllers/pharma/dashboardCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

// Allow SuperAdmin, QuanLyKho, and NhanVienBanHang to view dashboard
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho', 'NhanVienBanHang'));

/**
 * @swagger
 * tags:
 *   - name: Pharma - Dashboard
 *     description: Dashboard statistics and overview data for admin panel
 */

/**
 * @swagger
 * /dashboard/:
 *   get:
 *     summary: Get legacy complete dashboard (Heatmap, Expiry, Inventory)
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data loaded successfully
 */
router.get('/', getDashboardData);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get 4 high-level stat cards (Revenue, Orders, Customers, Low Stock)
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats loaded successfully
 */
router.get('/stats', getDashboardStats);

/**
 * @swagger
 * /dashboard/revenue:
 *   get:
 *     summary: Get monthly revenue and orders chart data
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chart data loaded successfully
 */
router.get('/revenue', getRevenueChart);

/**
 * @swagger
 * /dashboard/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: Top products loaded successfully
 */
router.get('/top-products', getTopProducts);

/**
 * @swagger
 * /dashboard/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items loaded successfully
 */
router.get('/low-stock', getLowStockAlerts);

export default router;