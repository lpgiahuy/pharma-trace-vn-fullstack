import express from 'express';
import {
    getFraudAlerts,
    getFraudStats,
    updateAlertStatus,
    simulateScanEngine
} from '../../controllers/admin/fraudAnomalyCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'));

router.get('/alerts', getFraudAlerts);
router.get('/stats', getFraudStats);
router.patch('/alerts/:id/status', updateAlertStatus);
router.post('/scan-simulation', simulateScanEngine);

export default router;
