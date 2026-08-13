import express from 'express';
import { 
    getFinanceStats, 
    getCashbook, 
    createCashbook, 
    getAr, 
    payArDebt, 
    getAp, 
    payApDebt 
} from '../../controllers/admin/financeCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('Admin', 'SuperAdmin', 'QuanLyKho', 'KeToan'));

router.get('/stats', getFinanceStats);
router.get('/cashbook', getCashbook);
router.post('/cashbook', createCashbook);
router.get('/ar', getAr);
router.post('/ar/:id/pay', payArDebt);
router.get('/ap', getAp);
router.post('/ap/:id/pay', payApDebt);

export default router;
