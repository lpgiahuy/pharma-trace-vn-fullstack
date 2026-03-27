import express from 'express';
import { 
    createProduct, 
    deleteProduct, 
    getAllProductsAdmin, 
    getProductDetailAdmin, 
    updateProduct 
} from '../../controllers/admin/adminProductCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Products
 *     description: Pharmaceutical product management (For SuperAdmin / Warehouse Manager)
 */

// All routes in this file require Admin / Warehouse Manager permissions
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho'));

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get list of all pharmaceutical products (including hidden/inactive ones)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully returned list of products with categories
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', getAllProductsAdmin);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get detailed information of a product including all packaging options
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details and array of packaging units
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductDetailAdmin);

/**
 * @swagger
 * /admin/products/add:
 *   post:
 *     summary: Add a new pharmaceutical product with packaging units
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - thong_tin_thuoc
 *               - quy_cach_dong_goi
 *             properties:
 *               thong_tin_thuoc:
 *                 type: object
 *                 required:
 *                   - ten_thuoc
 *                   - so_dang_ky
 *                   - danh_muc_id
 *                 properties:
 *                   ten_thuoc:
 *                     type: string
 *                     example: "Paracetamol 500mg"
 *                   so_dang_ky:
 *                     type: string
 *                     example: "VD-12345-22"
 *                   danh_muc_id:
 *                     type: integer
 *                     example: 1
 *                   don_vi_san_xuat_id:
 *                     type: integer
 *                     example: 5
 *                   hinh_anh_url:
 *                     type: string
 *                     example: "https://image.com/pax.jpg"
 *                   la_thuoc_ke_don:
 *                     type: boolean
 *                     example: false
 *                   mo_ta_ngan:
 *                     type: string
 *                     example: "Pain relief, fever reduction"
 *                   chi_tiet_thuoc:
 *                     type: object
 *                     example:
 *                       thanh_phan: "Paracetamol"
 *                       chong_chi_dinh: "Do not use if allergic..."
 *               quy_cach_dong_goi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ten_don_vi
 *                     - he_so_quy_doi
 *                     - gia_ban
 *                     - la_don_vi_co_ban
 *                   properties:
 *                     ten_don_vi:
 *                       type: string
 *                       example: "Tablet"
 *                     he_so_quy_doi:
 *                       type: integer
 *                       example: 1
 *                     gia_ban:
 *                       type: number
 *                       example: 1000
 *                     la_don_vi_co_ban:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Duplicate registration number or missing base packaging unit
 */
router.post('/add', createProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update product information and refresh packaging units
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - thong_tin_thuoc
 *               - quy_cach_dong_goi
 *             properties:
 *               thong_tin_thuoc:
 *                 type: object
 *                 properties:
 *                   ten_thuoc:
 *                     type: string
 *                     example: "Test Medicine System 2026"
 *                   so_dang_ky:
 *                     type: string
 *                     example: "TEST-REG-2026"
 *                   danh_muc_id:
 *                     type: integer
 *                     example: 1
 *                   don_vi_san_xuat_id:
 *                     type: integer
 *                     example: 1
 *                   hinh_anh_url:
 *                     type: string
 *                     example: "https://via.placeholder.com/300"
 *                   la_thuoc_ke_don:
 *                     type: boolean
 *                     example: false
 *                   mo_ta_ngan:
 *                     type: string
 *                     example: "Updated product description"
 *                   chi_tiet_thuoc:
 *                     type: object
 *                     example: { "thanh_phan": "Active ingredient X 500mg", "score": 5.0 }
 *                   trang_thai:
 *                     type: boolean
 *                     example: true
 *               quy_cach_dong_goi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ten_don_vi
 *                     - he_so_quy_doi
 *                     - gia_ban
 *                     - la_don_vi_co_ban
 *                   properties:
 *                     ten_don_vi:
 *                       type: string
 *                       example: "Tablet"
 *                     he_so_quy_doi:
 *                       type: integer
 *                       example: 1
 *                     gia_ban:
 *                       type: number
 *                       example: 5000
 *                     la_don_vi_co_ban:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Product and packaging units updated successfully
 *       400:
 *         description: Invalid data or missing base packaging unit
 *       404:
 *         description: Product not found
 */
router.put('/:id', updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Soft delete a product (change status to inactive)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product soft-deleted successfully
 *       404:
 *         description: Product not found or already deleted
 */
router.delete('/:id', deleteProduct);

export default router;