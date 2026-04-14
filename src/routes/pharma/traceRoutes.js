import express from 'express';
import { scanQR } from '../../controllers/pharma/traceController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Pharma - Traceability
 *     description: Pharmaceutical traceability using QR code (Requires authentication)
 */

/**
 * @swagger
 * /trace/scan-qr:
 *   post:
 *     summary: Scan QR code to trace product batch and movement history
 *     tags: [Pharma - Traceability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *             properties:
 *               uid:
 *                 type: string
 *                 example: "bbbf80ea-0a2b-40b0-9911-14a43c3aa7e4"
 *                 description: Unique identifier (UID) of the medicine box scanned from QR code
 *     responses:
 *       200:
 *         description: Returns detailed traceability information (batch, manufacturer, expiry date, warehouse movement history)
 *       400:
 *         description: Invalid or missing UID data
 *       401:
 *         description: Authentication error - Not logged in
 *       404:
 *         description: No medicine box found matching this UID
 */
router.post('/scan-qr', protect, scanQR);

export default router;