import express from 'express';
import { getCategories, getProducts, getProductDetail, getBrands } from '../../controllers/ecom/productController.js';
import { optionalProtect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Products
 *     description: Product and Category APIs for customers (Public)
 */

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [E-com - Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       ten_danh_muc:
 *                         type: string
 *                         example: "Thuốc kê đơn"
 *                       hinh_anh_icon:
 *                         type: string
 *                         example: "https://example.com/icon.png"
 *       500:
 *         description: Internal server error
 */

router.get('/categories', getCategories);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get list of products (supports pagination, filtering, and search)
 *     tags: [E-com - Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Current page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, best_selling]
 *           default: newest
 *         description: |
 *           Sort products criteria:
 *           * `newest` - Newest products (Default)
 *           * `price_asc` - Price ascending
 *           * `price_desc` - Price descending
 *           * `best_selling` - Best selling products
 *     responses:
 *       200:
 *         description: Successfully retrieved list of products
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
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     limit_per_page:
 *                       type: integer
 *                       example: 20
 *                     items:
 *                       type: array
 *                       description: Array of product objects
 */

router.get('/', optionalProtect, getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get detailed information of a product by ID or Slug
 *     tags: [E-com - Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (e.g., 1) or Slug (e.g., thuoc-panadol)
 *     responses:
 *       200:
 *         description: Successfully retrieved product details
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
 *                   description: Product details including packaging variants and HTML descriptions
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 */

/**
 * @swagger
 * /products/brands:
 *   get:
 *     summary: Get all product brands/manufacturers
 *     tags: [E-com - Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "DHG Pharma"
 */
router.get('/brands', getBrands);

router.get('/:id', optionalProtect, getProductDetail);

export default router;