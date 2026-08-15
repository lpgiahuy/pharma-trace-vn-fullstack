import express from 'express';
import {
    getPublicCategories, getAllCategoriesAdmin,
    createCategory, updateCategory, deleteCategory
} from '../../controllers/admin/adminCategoryCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Categories
 *     description: Product category management (Public and Admin endpoints)
 */

// ==============================================================================
// 1. PUBLIC API (No authentication required)
// ==============================================================================
/**
 * @swagger
 * /admin/categories/public:
 *   get:
 *     summary: Get active categories for customers (Public API)
 *     description: Public endpoint - no authentication required. Returns only active categories (trang_thai = true).
 *     tags: [Admin - Categories]
 *     responses:
 *       200:
 *         description: Successfully retrieved active categories
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   ten_danh_muc: "Prescription Medicines"
 *                   danh_muc_cha_id: null
 *                   hinh_anh_icon: "icon-pill.png"
 *                   thu_tu_hien_thi: 1
 *                   trang_thai: true
 */
router.get('/public', getPublicCategories);

// ==============================================================================
// 2. AUTHENTICATION MIDDLEWARE
// ==============================================================================
router.use(protect);

// ==============================================================================
// 3. ADMIN API
// ==============================================================================
router.get('/', authorizeRoles('SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang'), getAllCategoriesAdmin);
router.post('/', authorizeRoles('SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'), createCategory);
router.put('/:id', authorizeRoles('SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'), updateCategory);
router.delete('/:id', authorizeRoles('SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'), deleteCategory);

export default router;