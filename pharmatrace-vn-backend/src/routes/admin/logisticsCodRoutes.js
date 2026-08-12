import express from 'express';
import {
    getShipments,
    getCodSummary,
    createShipment,
    updateShipmentStatus,
    reconcileCod
} from '../../controllers/admin/logisticsCodCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho', 'NhanVienBanHang'));

router.get('/shipments', getShipments);
router.get('/cod-summary', getCodSummary);
router.post('/shipments', createShipment);
router.patch('/shipments/:id/status', updateShipmentStatus);
router.patch('/shipments/:id/reconcile-cod', reconcileCod);

export default router;
