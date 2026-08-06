import express from 'express';
import {
    transferWarehouse,
    handleDisposal,
    handleRMA,
    handleBatchRecall,
    getAllLogisticsUnits,
    getProductsInUnit,
    getBatchesInUnit,
    getUIDsForTransfer,
} from '../../controllers/pharma/logisticsCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Logistics
 *     description: Warehouse management, stock transfer, returns, and pharmaceutical recall
 */

router.use(protect);

// GET read-only: all warehouse staff can view units, products, batches
const allStaff = authorizeRoles('SuperAdmin', 'QuanLyKho', 'NhanVienBanHang');
router.get('/units',                   allStaff, getAllLogisticsUnits);
router.get('/units/:id/products',      allStaff, getProductsInUnit);
router.get('/units/:id/batches',       allStaff, getBatchesInUnit);
router.get('/units/:id/uids',          allStaff, getUIDsForTransfer);

// POST write operations: only managers and above
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho'));

/**
 * @swagger
 * /logistics/transfer:
 *   post:
 *     summary: Transfer medicine boxes between warehouses/units
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tu_don_vi_id
 *               - den_don_vi_id
 *               - mang_uid
 *             properties:
 *               tu_don_vi_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the source warehouse/unit
 *               den_don_vi_id:
 *                 type: integer
 *                 example: 2
 *                 description: ID of the destination warehouse/unit
 *               mang_uid:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"]
 *                 description: Array of UID of medicine boxes to be transferred
 *     responses:
 *       200:
 *         description: Stock transfer completed successfully
 *       400:
 *         description: Missing information or exceeds limit (5000 boxes per transfer)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/transfer', transferWarehouse);

/**
 * @swagger
 * /logistics/dispose:
 *   post:
 *     summary: Dispose of damaged or expired medicine boxes
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - don_vi_id
 *               - mang_uid
 *               - ly_do
 *             properties:
 *               don_vi_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the warehouse performing the disposal
 *               mang_uid:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["33333333-3333-3333-3333-333333333333"]
 *                 description: Array of UID of medicine boxes to dispose
 *               ly_do:
 *                 type: string
 *                 example: "Box damaged during transportation"
 *                 description: Reason for disposal
 *     responses:
 *       200:
 *         description: Disposal completed successfully
 *       400:
 *         description: Missing information or reason
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/dispose', handleDisposal);

/**
 * @swagger
 * /logistics/return:
 *   post:
 *     summary: Process product return (customer return or undelivered order)
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - don_hang_id
 *               - don_vi_nhan_id
 *               - mang_uid
 *             properties:
 *               don_hang_id:
 *                 type: integer
 *                 example: 105
 *                 description: ID of the order being returned
 *               don_vi_nhan_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the warehouse receiving the returned items
 *               mang_uid:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["11111111-1111-1111-1111-111111111111"]
 *                 description: Array of UID of returned medicine boxes
 *     responses:
 *       200:
 *         description: Return processed and stock updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/return', handleRMA);

/**
 * @swagger
 * /logistics/recall/{loThuocId}:
 *   post:
 *     summary: Emergency batch recall of medicine
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loThuocId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the medicine batch to recall
 *     responses:
 *       200:
 *         description: Emergency recall completed successfully
 *       400:
 *         description: Missing or invalid batch ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Only SuperAdmin has permission to perform batch recall
 */
router.post('/recall/:loThuocId', handleBatchRecall);

export default router;