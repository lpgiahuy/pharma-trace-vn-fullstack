import express from 'express';
import { scanQR } from '../../controllers/pharma/traceController.js';
import { optionalProtect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Pharma - Traceability
 *     description: Pharmaceutical traceability using QR code (Public - no authentication required)
 */

/**
 * @swagger
 * /trace/scan-qr:
 *   post:
 *     summary: Scan QR code to trace product batch and movement history (public endpoint)
 *     tags: [Pharma - Traceability]
 *     security: []
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
 *                 example: "5dbf5a73-6bd9-4a78-8f6f-0bdca4ab8d9a"
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
router.post('/scan-qr', optionalProtect, scanQR);

export default router;