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

// Apply middleware to all routes
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'QuanLyKho'));

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all pharmaceutical products (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a list of all products with optional pagination and filtering.
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/', getAllProductsAdmin);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get detailed information of a pharmaceutical product (Admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductDetailAdmin);

/**
 * @swagger
 * /admin/products/add:
 *   post:
 *     summary: Add a new pharmaceutical product with packaging units
 *     description: Create a new product including detailed drug information and multiple packaging options.
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
 *                     example: "Panadol Extra"
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
 *                     example: "https://image.com/panadol.jpg"
 *                   la_thuoc_ke_don:
 *                     type: boolean
 *                     example: false
 *                   mo_ta_ngan:
 *                     type: string
 *                     example: "Pain relief and fever reduction"
 *                   chi_tiet_thuoc:
 *                     type: object
 *                     description: JSON data containing detailed drug information extracted by AI (Open Schema)
 *                     example:
 *                       mo_ta_chung: "Panadol Extra contains paracetamol as an antipyretic and analgesic..."
 *                       chi_dinh:
 *                         - "Headache"
 *                         - "Migraine"
 *                         - "Muscle pain"
 *                       thanh_phan_chi_tiet:
 *                         hoat_chat: "Paracetamol 500mg, Caffeine 65mg"
 *                         ta_duoc: "Pregelatinised starch, povidone k-25..."
 *                       huong_dan_su_dung:
 *                         cach_dung: "Oral administration."
 *                         lieu_dung: "Adults and children over 12 years: 1-2 tablets every 4-6 hours."
 *                       tac_dung_phu:
 *                         - "Thrombocytopenia"
 *                         - "Skin hypersensitivity reactions"
 *                       chong_chi_dinh:
 *                         - "Patients with a history of hypersensitivity to paracetamol"
 *               quy_cach_dong_goi:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - ten_don_vi
 *                     - gia_ban
 *                   properties:
 *                     ten_don_vi:
 *                       type: string
 *                       example: "Tablet"
 *                     gia_ban:
 *                       type: number
 *                       format: float
 *                       example: 2000
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Duplicate registration number or missing packaging unit
 */
router.post('/add', createProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update product information and refresh packaging units
 *     description: Update drug information and completely replace the list of packaging units.
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
 *             properties:
 *               thong_tin_thuoc:
 *                 type: object
 *                 properties:
 *                   ten_thuoc:
 *                     type: string
 *                     example: "Panadol Extra"
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
 *                     example: "https://image.com/panadol.jpg"
 *                   la_thuoc_ke_don:
 *                     type: boolean
 *                     example: false
 *                   mo_ta_ngan:
 *                     type: string
 *                     example: "Pain relief and fever reduction"
 *                   chi_tiet_thuoc:
 *                     type: object
 *                     description: JSON data containing detailed drug information (AI extracted - Open Schema)
 *               quy_cach_dong_goi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ten_don_vi:
 *                       type: string
 *                       example: "Tablet"
 *                     gia_ban:
 *                       type: number
 *                       format: float
 *                       example: 2000
 *     responses:
 *       200:
 *         description: Product and packaging units updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a pharmaceutical product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', deleteProduct);

export default router;