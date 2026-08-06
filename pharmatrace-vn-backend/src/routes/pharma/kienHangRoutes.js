import express from 'express';
import {
    createBundle,
    transferBundle,
    getBundleDetail,
    listBundles,
    updateBundleStatus,
    resolveSSCCToUIDs,
} from '../../controllers/pharma/kienHangCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: KienHang
 *     description: Bundle/Pallet management — scan SSCC QR to process entire pallets at once
 */

// All routes require authentication and warehouse or admin role
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho'));

/**
 * @swagger
 * /kien-hang:
 *   get:
 *     summary: List all KienHang (bundles/pallets)
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: don_vi_id
 *         schema:
 *           type: integer
 *         description: Filter by warehouse unit ID (SuperAdmin only; QuanLyKho is auto-filtered)
 *     responses:
 *       200:
 *         description: List of bundles with box count
 */
router.get('/', listBundles);

/**
 * @swagger
 * /kien-hang:
 *   post:
 *     summary: Create a new KienHang (Thùng or Pallet) and optionally assign medicine boxes to it
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ma_sscc
 *               - loai_kien
 *               - don_vi_so_huu_id
 *             properties:
 *               ma_sscc:
 *                 type: string
 *                 example: "003401234567890123"
 *                 description: Unique SSCC barcode identifier for this bundle
 *               loai_kien:
 *                 type: string
 *                 enum: [Thung, Pallet]
 *                 example: "Pallet"
 *               don_vi_so_huu_id:
 *                 type: integer
 *                 example: 1
 *               mang_uid:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of medicine box UIDs to assign to this bundle
 *                 example: ["uuid-1", "uuid-2"]
 *     responses:
 *       201:
 *         description: Bundle created successfully
 *       400:
 *         description: Missing fields or exceeds 5000 box limit
 */
router.post('/', createBundle);

/**
 * @swagger
 * /kien-hang/transfer:
 *   post:
 *     summary: Transfer an entire KienHang to another warehouse by scanning its SSCC
 *     description: >
 *       Scans the SSCC QR code of a Pallet/Thùng and moves ALL medicine boxes inside
 *       to the destination warehouse in a single atomic database transaction.
 *       This replaces the need to scan thousands of individual box UIDs.
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ma_sscc
 *               - den_don_vi_id
 *             properties:
 *               ma_sscc:
 *                 type: string
 *                 example: "003401234567890123"
 *                 description: SSCC of the pallet being transferred
 *               den_don_vi_id:
 *                 type: integer
 *                 example: 3
 *                 description: ID of the destination warehouse unit
 *     responses:
 *       200:
 *         description: Entire pallet transferred successfully
 *       404:
 *         description: SSCC not found
 *       400:
 *         description: Source and destination are the same
 */
router.post('/transfer', transferBundle);

/**
 * @swagger
 * /kien-hang/{sscc}:
 *   get:
 *     summary: Get full detail of a KienHang by SSCC — includes all medicine boxes inside
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sscc
 *         required: true
 *         schema:
 *           type: string
 *         description: SSCC code of the bundle (scanned from QR)
 *     responses:
 *       200:
 *         description: Bundle detail with list of medicine boxes
 *       404:
 *         description: Bundle not found
 */
router.get('/:sscc', getBundleDetail);

/**
 * @swagger
 * /kien-hang/{sscc}/status:
 *   patch:
 *     summary: Update the status of a KienHang
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sscc
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [SanSang, DangGiao, DaNhan, DaRaLe]
 *                 example: "DaNhan"
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Bundle not found
 */
router.patch('/:sscc/status', updateBundleStatus);

/**
 * @swagger
 * /kien-hang/{sscc}/resolve-uids:
 *   get:
 *     summary: Resolve SSCC → array of active medicine box UIDs inside the bundle
 *     description: >
 *       Returns the full list of active (non-destroyed, non-recalled) UID codes inside a pallet.
 *       Use this when you need to pass individual UIDs to other operations (disposal, RMA, etc.)
 *       after scanning the pallet QR code.
 *     tags: [KienHang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sscc
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of UIDs resolved from the scanned pallet
 *       404:
 *         description: SSCC not found or no active boxes inside
 */
router.get('/:sscc/resolve-uids', resolveSSCCToUIDs);

export default router;
