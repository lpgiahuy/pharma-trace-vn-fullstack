import express from 'express';
import { getStaffList, createStaffAccount, updateStaffInfo, disableStaffAccount } from '../../controllers/admin/adminStaffCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Staff
 *     description: Staff account and permission management (SuperAdmin only)
 */

// HIGH SECURITY: Only SuperAdmin is allowed to manage staff accounts!
router.use(protect);
router.use(authorizeRoles('SuperAdmin'));

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Get list of all staff members (including their assigned unit)
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved staff list
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   ho_ten: "Nguyễn Văn A"
 *                   email: "nva@pharmatrace.vn"
 *                   vai_tro: "QuanLyKho"
 *                   trang_thai: true
 *                   ten_don_vi: "Southern Main Warehouse"
 *       403:
 *         description: Access denied (Only SuperAdmin can view this)
 */
router.get('/', getStaffList);

/**
 * @swagger
 * /admin/staff/add:
 *   post:
 *     summary: Create a new staff account
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - don_vi_id
 *               - ho_ten
 *               - email
 *               - password
 *               - vai_tro
 *             properties:
 *               don_vi_id:
 *                 type: integer
 *                 example: 2
 *                 description: ID of the unit/warehouse/pharmacy where the staff works
 *               ho_ten:
 *                 type: string
 *                 example: "Trần Thị B"
 *               email:
 *                 type: string
 *                 example: "ttb@pharmatrace.vn"
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *               vai_tro:
 *                 type: string
 *                 enum: [SuperAdmin, QuanLyKho, BanHang, KeToan, DuocSi]
 *                 example: "BanHang"
 *                 description: Staff role and permissions
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *       400:
 *         description: Email already exists or invalid role
 */
router.post('/add', createStaffAccount);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: Update staff information or permissions (Partial update supported)
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the staff member to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               don_vi_id:
 *                 type: integer
 *                 example: 3
 *               ho_ten:
 *                 type: string
 *                 example: "Trần Thị B Updated"
 *               vai_tro:
 *                 type: string
 *                 enum: [SuperAdmin, QuanLyKho, BanHang, KeToan, DuocSi]
 *                 example: "QuanLyKho"
 *               trang_thai:
 *                 type: boolean
 *                 example: true
 *                 description: Set to false to suspend the staff account
 *     responses:
 *       200:
 *         description: Staff information updated successfully
 *       404:
 *         description: Staff member not found
 */
router.put('/:id', updateStaffInfo);

/**
 * @swagger
 * /admin/staff/{id}:
 *   delete:
 *     summary: Disable staff account (Soft delete - Change status to inactive)
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the staff member to disable
 *     responses:
 *       200:
 *         description: Staff account disabled successfully
 *       404:
 *         description: Staff member not found
 */
router.delete('/:id', disableStaffAccount);

export default router;