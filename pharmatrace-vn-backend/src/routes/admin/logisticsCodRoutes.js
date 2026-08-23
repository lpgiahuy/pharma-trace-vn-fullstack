import express from 'express';
import {
    getShipments,
    getCodSummary,
    createShipment,
    updateShipmentStatus,
    reconcileCod,
    deleteShipment,
    getOrderInfoForShipment
} from '../../controllers/admin/logisticsCodCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'));

router.get('/shipments', getShipments);
router.get('/cod-summary', getCodSummary);
router.post('/shipments', createShipment);
router.patch('/shipments/:id/status', updateShipmentStatus);
router.patch('/shipments/:id/reconcile-cod', reconcileCod);
router.delete('/shipments/:id', deleteShipment);
router.get('/order-info/:orderId', getOrderInfoForShipment);

export default router;
