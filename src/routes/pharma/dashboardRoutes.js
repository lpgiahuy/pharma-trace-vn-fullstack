import express from 'express';
import { getDashboardData } from '../../controllers/pharma/dashboardCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Pharma - Dashboard
 *     description: Dashboard statistics and overview data for admin panel (SuperAdmin only)
 */

/**
 * @swagger
 * /dashboard/:
 *   get:
 *     summary: Get all dashboard statistics data (Revenue, Inventory, Alerts)
 *     tags: [Pharma - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data loaded successfully
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
 *                   example: "Admin dashboard data loaded successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     heatmap_diem_nong:
 *                       type: array
 *                       description: List of suspicious QR scan coordinates (potential counterfeit)
 *                       items:
 *                         type: object
 *                         properties:
 *                           toa_do_lat:
 *                             type: number
 *                             example: 10.762622
 *                           toa_do_lng:
 *                             type: number
 *                             example: 106.660172
 *                           so_luong_quet:
 *                             type: integer
 *                             example: 5
 *                     thuoc_can_date:
 *                       type: array
 *                       description: List of medicines nearing expiry (within 60 days)
 *                       items:
 *                         type: object
 *                         properties:
 *                           duoc_pham_id:
 *                             type: integer
 *                             example: 15
 *                           ten_thuoc:
 *                             type: string
 *                             example: "Vitamin C 1000mg"
 *                           han_su_dung:
 *                             type: string
 *                             format: date
 *                             example: "2024-05-20"
 *                     bieu_do_doanh_thu:
 *                       type: array
 *                       description: Revenue chart for the last 30 days
 *                       items:
 *                         type: object
 *                         properties:
 *                           ngay:
 *                             type: string
 *                             format: date
 *                             example: "2024-03-24"
 *                           tong_doanh_thu:
 *                             type: integer
 *                             example: 15000000
 *                     tong_quan_kho:
 *                       type: array
 *                       description: Overall inventory summary by warehouse
 *                       items:
 *                         type: object
 *                         properties:
 *                           ten_don_vi:
 *                             type: string
 *                             example: "Southern Main Warehouse"
 *                           tong_san_pham:
 *                             type: integer
 *                             example: 15200
 *       401:
 *         description: Authentication error - Not logged in
 *       403:
 *         description: Permission error - Only SuperAdmin can access this data
 */
router.get('/', protect, authorizeRoles('SuperAdmin'), getDashboardData);

export default router;