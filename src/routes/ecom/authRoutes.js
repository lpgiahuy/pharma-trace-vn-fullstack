import express from 'express';
import { register, login } from '../../controllers/ecom/authController.js';

const router = express.Router();

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
router.post('/register', register);

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
router.post('/login', login);

export default router;