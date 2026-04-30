import express from 'express';
import { uploadPrescription, getMyPrescriptions } from '../../controllers/ecom/prescriptionCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { upload } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - Prescriptions
 *     description: Manage customer prescriptions for pharmacist review
 */

/**
 * @swagger
 * /prescriptions/upload:
 *   post:
 *     summary: Upload prescription image
 *     tags:
 *       - Ecom - Prescriptions
 */
router.post('/upload', protect, upload.single('hinh_anh'), uploadPrescription);

/**
 * @swagger
 * /prescriptions:
 *   get:
 *     summary: List customer prescriptions (Paginated)
 *     tags:
 *       - Ecom - Prescriptions
 */
router.get('/', protect, getMyPrescriptions);

export default router;