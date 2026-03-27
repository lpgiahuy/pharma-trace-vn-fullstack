import express from 'express';
import { createReview, getReviews } from '../../controllers/ecom/reviewCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - Reviews
 *     description: Product review management from customers
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a specific product
 *     description: Public API. Guests can view product reviews without logging in.
 *     tags: [Ecom - Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product to retrieve reviews for
 *     responses:
 *       200:
 *         description: Successfully retrieved product reviews
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               total_reviews: 2
 *               data:
 *                 - id: 1
 *                   so_sao: 5
 *                   noi_dung: "Sản phẩm tốt, giao hàng nhanh!"
 *                   ngay_danh_gia: "2024-03-24T10:00:00.000Z"
 *                   ten_khach_hang: "Nguyễn Văn A"
 *       404:
 *         description: Product not found
 */
router.get('/product/:productId', getReviews);

/**
 * @swagger
 * /reviews/add:
 *   post:
 *     summary: Submit a review for a product
 *     description: Requires customer authentication (JWT token). Each customer can review a product only once.
 *     tags: [Ecom - Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - duoc_pham_id
 *               - so_sao
 *             properties:
 *               duoc_pham_id:
 *                 type: integer
 *                 example: 15
 *                 description: ID of the product being reviewed
 *               so_sao:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: Rating score from 1 to 5 stars
 *               noi_dung:
 *                 type: string
 *                 example: "Genuine medicine, carefully packaged, long expiry date."
 *                 description: Customer's detailed comment
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid data or customer has already reviewed this product
 *       401:
 *         description: Not authenticated or token expired
 */
router.post('/add', protect, createReview);

export default router;