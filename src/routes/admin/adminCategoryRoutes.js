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
// 2. AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==============================================================================
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang'));

// ==============================================================================
// 3. ADMIN-ONLY API
// ==============================================================================
/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories (Admin only)
 *     description: Requires authentication. Returns all categories including inactive ones (trang_thai = false).
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all categories
 */
router.get('/', getAllCategoriesAdmin);

/**
 * @swagger
 * /admin/categories/add:
 *   post:
 *     summary: Create a new product category
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten_danh_muc
 *             properties:
 *               ten_danh_muc:
 *                 type: string
 *                 example: "Functional Foods"
 *               danh_muc_cha_id:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *                 description: Parent category ID (null if root category)
 *               hinh_anh_icon:
 *                 type: string
 *                 example: "url_hinh_anh_tu_cloudinary"
 *               thu_tu_hien_thi:
 *                 type: integer
 *                 example: 2
 *                 description: Display order on the menu
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category name already exists or missing required information
 */
router.post('/add', createCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update category information
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_danh_muc:
 *                 type: string
 *                 example: "Functional Foods (Updated)"
 *               danh_muc_cha_id:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *               hinh_anh_icon:
 *                 type: string
 *               thu_tu_hien_thi:
 *                 type: integer
 *               trang_thai:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Duplicate category name
 *       404:
 *         description: Category not found
 */
router.put('/:id', updateCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Soft delete a category (Hide from customers)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the category to soft delete
 *     responses:
 *       200:
 *         description: Category hidden successfully
 *       404:
 *         description: Category not found
 */
router.delete('/:id', deleteCategory);

export default router;