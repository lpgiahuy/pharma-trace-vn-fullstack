import express from 'express';
import { getCart, addCartItem } from '../../controllers/ecom/cartController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Cart
 *     description: Customer shopping cart management (Requires authentication)
 */

// Force authentication for all cart routes
router.use(protect);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get my cart details
 *     tags: [E-com - Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Authentication error - Not logged in or token expired
 */
router.get('/', getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add a product to the shopping cart
 *     tags: [E-com - Cart]
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
 *               - quy_cach_id
 *               - so_luong
 *             properties:
 *               duoc_pham_id:
 *                 type: integer
 *                 example: 15
 *                 description: ID of the product (medicine)
 *               quy_cach_id:
 *                 type: integer
 *                 example: 3
 *                 description: ID of the packaging type (e.g., blister pack, box, etc.)
 *               so_luong:
 *                 type: integer
 *                 example: 2
 *                 description: Quantity to purchase
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Missing information or invalid quantity
 *       401:
 *         description: Authentication error - Not logged in
 */
router.post('/add', addCartItem);

export default router;