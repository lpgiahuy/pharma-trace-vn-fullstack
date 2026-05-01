import express from 'express';
import { login, setupAdmin } from '../../controllers/admin/adminAuthCtrl.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Auth
 *     description: Admin and staff authentication system with initial setup
 */

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Login to the admin management system (Admin/Staff)
 *     tags: [Admin - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@pharmachain.vn"
 *                 description: Email of the admin or staff member
 *               password:
 *                 type: string
 *                 example: "123456"
 *                 description: Login password
 *     responses:
 *       200:
 *         description: Login successful, returns user information and JWT token
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Admin login successful!"
 *               data:
 *                 token: "eyJhbGciOiJIUzI1..."
 *                 user: 
 *                   id: 1
 *                   ho_ten: "Admin Tối Cao"
 *                   vai_tro: "SuperAdmin"
 *       401:
 *         description: Invalid email or password
 *       400:
 *         description: Missing login credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /admin/auth/setup:
 *   post:
 *     summary: Initialize the first SuperAdmin account (Use only during system deployment)
 *     tags: [Admin - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - email
 *               - password
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: "Admin Tối Cao"
 *               email:
 *                 type: string
 *                 example: "admin@pharmachain.vn"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               don_vi_id:
 *                 type: integer
 *                 example: 1
 *                 description: Management unit ID (default 1 is Head Office)
 *     responses:
 *       201:
 *         description: SuperAdmin account created successfully
 *       400:
 *         description: Email already exists or invalid data
 */
router.post('/setup', setupAdmin);

export default router;