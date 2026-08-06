import express from 'express';
import { getMyWishlist, addWishlist, removeWishlist, toggleWishlist } from '../../controllers/ecom/wishlistCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - Wishlist
 *     description: Customer wishlist (favorite products) management
 */

// All wishlist APIs require customer authentication
router.use(protect);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get my wishlist
 *     description: Requires customer JWT token. Returns list of favorited products sorted by most recently added.
 *     tags: [Ecom - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved wishlist
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               total_items: 2
 *               data:
 *                 - duoc_pham_id: 15
 *                   ten_thuoc: "Duspatalin retard 200mg Capsules"
 *                   hinh_anh_url: "https://example.com/image.jpg"
 *                   mo_ta_ngan: "Treatment of abdominal pain due to gastrointestinal disorders"
 *                   ngay_them: "2024-03-24T10:00:00.000Z"
 *       401:
 *         description: Not authenticated or invalid token
 */
router.get('/', getMyWishlist);

/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add a product to wishlist
 *     description: Requires customer JWT token. If the product is already in the wishlist, the system will ignore it without error.
 *     tags: [Ecom - Wishlist]
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
 *             properties:
 *               duoc_pham_id:
 *                 type: integer
 *                 example: 15
 *                 description: ID of the product to add to wishlist
 *     responses:
 *       201:
 *         description: Product added to wishlist successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Product added to your wishlist!"
 *       200:
 *         description: Product was already in the wishlist
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "This product is already in your wishlist."
 *       400:
 *         description: Missing product ID
 */
router.post('/add', addWishlist);

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Toggle product in favorites (add if not exists, remove if exists)
 *     tags: [Ecom - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duoc_pham_id]
 *             properties:
 *               duoc_pham_id: { type: integer }
 *     responses:
 *       200:
 *         description: Toggled successfully
 */
router.post('/toggle', toggleWishlist);

/**
 * @swagger
 * /wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Ecom - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product to remove from wishlist
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Product removed from your wishlist!"
 *       404:
 *         description: Product was not in the wishlist
 */
router.delete('/remove/:productId', removeWishlist);

export default router;