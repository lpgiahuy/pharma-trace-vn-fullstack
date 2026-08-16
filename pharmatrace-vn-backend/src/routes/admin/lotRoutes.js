import express from 'express';
import {
    getLots,
    getLotStats,
    createLot,
    recallLot
} from '../../controllers/admin/lotCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'));

router.get('/', getLots);
router.get('/stats', getLotStats);
router.post('/', createLot);
router.patch('/:id/recall', recallLot);

export default router;
