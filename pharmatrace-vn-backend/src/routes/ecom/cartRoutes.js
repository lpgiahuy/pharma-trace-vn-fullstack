import express from 'express';
import { getCart, addCartItem, updateCartItem, removeCartItem } from '../../controllers/ecom/cartController.js';
import { protect, restrictTo } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Cart
 *     description: Customer shopping cart management (Requires authentication)
 */

// Force authentication for all cart routes
router.use(protect, restrictTo('customer'));

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
 * /cart/items:
 *   post:
 *     summary: Add a product item to the shopping cart
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
 *               quy_cach_id:
 *                 type: integer
 *               so_luong:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 */
router.post('/items', addCartItem);
router.post('/add', addCartItem); // Alias for backward compatibility

/**
 * @swagger
 * /cart/items:
 *   put:
 *     summary: Update quantity of a cart item
 *     tags: [E-com - Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duoc_pham_id:
 *                 type: integer
 *               quy_cach_id:
 *                 type: integer
 *               so_luong:
 *                 type: integer
 */
router.put('/items', updateCartItem);
router.put('/update', updateCartItem); // Alias for backward compatibility

/**
 * @swagger
 * /cart/items/{duoc_pham_id}:
 *   delete:
 *     summary: Remove a product from the cart
 *     tags: [E-com - Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: duoc_pham_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quy_cach_id
 *         schema:
 *           type: integer
 */
router.delete('/items/:duoc_pham_id', removeCartItem);
router.delete('/remove/:duoc_pham_id', removeCartItem); // Alias for backward compatibility

export default router;