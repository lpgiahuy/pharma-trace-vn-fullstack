import express from 'express';
import { register, login, logout, getMe, getLoyaltyProgress, updateMe, changeMyPassword } from '../../controllers/ecom/authController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authLimiter } from '../../middlewares/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Customer logout (clear cookies)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', logout);

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Customer Authentication System (E-commerce)
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - so_dien_thoai
 *               - mat_khau
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: "nguyenvana@gmail.com"
 *               mat_khau:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *               dia_chi:
 *                 type: string
 *                 example: "123 ABC Street, District 1, Ho Chi Minh City"
 *     responses:
 *       201:
 *         description: Account registered successfully
 *       400:
 *         description: Phone number or email already exists
 */
router.post('/register', authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - so_dien_thoai
 *               - mat_khau
 *             properties:
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0901234567"
 *               mat_khau:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid phone number or password
 */
router.post('/login', authLimiter, login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in customer profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', protect, getMe);
/**
 * @swagger
 * /auth/loyalty-progress:
 *   get:
 *     summary: Lấy tiến trình thăng hạng thẻ thành viên
 *     description: Trả về hạng hiện tại, hạng tiếp theo và số điểm còn thiếu để lên hạng.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hang_hien_tai:
 *                       type: string
 *                       example: "Đồng"
 *                     hang_tiep_theo:
 *                       type: string
 *                       example: "Bạc"
 *                     diem_con_thieu:
 *                       type: integer
 *                       example: 250
 */
router.get('/loyalty-progress', protect, getLoyaltyProgress);

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Cập nhật thông tin cá nhân
 *     description: Khách hàng cập nhật họ tên, email, hoặc địa chỉ mặc định. Các trường không gửi lên sẽ được giữ nguyên.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: "Nguyễn Văn B"
 *               email:
 *                 type: string
 *                 example: "email_moi@gmail.com"
 *               dia_chi_mac_dinh:
 *                 type: string
 *                 example: "456 Đường XYZ, Quận 3, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về thông tin mới
 *       400:
 *         description: Không có thông tin nào được gửi lên
 */
router.patch('/me', protect, updateMe);

/**
 * @swagger
 * /auth/me/change-password:
 *   patch:
 *     summary: Đổi mật khẩu
 *     description: Khách hàng đổi mật khẩu bằng cách cung cấp mật khẩu hiện tại và mật khẩu mới.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mat_khau_cu
 *               - mat_khau_moi
 *             properties:
 *               mat_khau_cu:
 *                 type: string
 *                 format: password
 *                 example: "OldPassword123"
 *               mat_khau_moi:
 *                 type: string
 *                 format: password
 *                 example: "NewPassword456"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Thiếu thông tin hoặc mật khẩu mới quá ngắn
 *       401:
 *         description: Mật khẩu hiện tại không đúng
 */
router.patch('/me/change-password', protect, changeMyPassword);

export default router;