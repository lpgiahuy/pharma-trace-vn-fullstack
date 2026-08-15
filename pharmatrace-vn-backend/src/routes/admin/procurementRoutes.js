import express from 'express';
import {
    getSuppliers,
    createSupplier,
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrderStatus
} from '../../controllers/admin/procurementCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

// Tất cả endpoints đều yêu cầu đăng nhập Admin
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'));

// Routes Quản lý Nhà cung cấp
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);

// Routes Quản lý Phiếu nhập hàng PO
router.get('/orders', getPurchaseOrders);
router.post('/orders', createPurchaseOrder);
router.get('/orders/:id', getPurchaseOrderById);
router.patch('/orders/:id/status', authorizeRoles('SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'Admin', 'admin'), updatePurchaseOrderStatus);

export default router;
