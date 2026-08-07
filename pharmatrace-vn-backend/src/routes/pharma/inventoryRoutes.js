import express from 'express';
import { importInventory, getBatchQRs, getInventoryList } from '../../controllers/pharma/inventoryCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js'; 

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Pharma - Inventory
 *     description: Inventory management and stock import (Requires Admin/Warehouse permission)
 */

/**
 * @swagger
 * /inventory/nhap-kho:
 *   post:
 *     summary: Import new medicine batch from supplier into inventory
 *     tags: [Pharma - Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duoc_pham_id
 *               - don_vi_id
 *               - so_lo
 *               - ngay_sx
 *               - hsd
 *               - so_luong_hop
 *             properties:
 *               duoc_pham_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the pharmaceutical product
 *               don_vi_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the receiving warehouse/unit
 *               so_lo:
 *                 type: string
 *                 example: "BATCH-2026-VIP"
 *                 description: Batch number of the medicine
 *               ngay_sx:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *                 description: Manufacturing date
 *               hsd:
 *                 type: string
 *                 format: date
 *                 example: "2030-03-01"
 *                 description: Expiry date
 *               so_luong_hop:
 *                 type: integer
 *                 example: 100
 *                 description: Number of boxes imported into inventory
 *     responses:
 *       200:
 *         description: Inventory import successful
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/nhap-kho',
  protect,
  authorizeRoles('SuperAdmin', 'QuanLyKho'),
  importInventory
);

router.get(
  '/nhap-kho',
  protect,
  authorizeRoles('SuperAdmin', 'QuanLyKho'),
  getInventoryList
);


/**
 * @swagger
 * /inventory/batch/{batchId}/qrs:
 *   get:
 *     summary: Get all box UIDs and QR signatures for a specific batch for label printing
 *     tags: [Pharma - Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the batch (LoThuoc)
 *     responses:
 *       200:
 *         description: List of box UIDs and signatures
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Batch not found
 */
router.get(
  '/batch/:batchId/qrs',
  protect,
  authorizeRoles('SuperAdmin', 'QuanLyKho'),
  getBatchQRs
);

export default router;