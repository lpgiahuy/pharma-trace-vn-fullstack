import express from 'express';
import {
    getCustomersCrm,
    getCrmStats,
    getCustomerPointsHistory,
    adjustCustomerPoints,
    getRmaRequests,
    updateRmaStatus,
    getRmaDetail
} from '../../controllers/admin/crmLoyaltyRmaCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'));

router.get('/customers', getCustomersCrm);
router.get('/stats', getCrmStats);
router.get('/customers/:customerId/points-history', getCustomerPointsHistory);
router.post('/adjust-points', adjustCustomerPoints);
router.get('/rma-requests', getRmaRequests);
router.get('/rma-requests/:id', getRmaDetail);
router.patch('/rma-requests/:id/status', updateRmaStatus);

export default router;
