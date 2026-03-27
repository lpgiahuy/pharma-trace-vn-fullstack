import express from 'express';
import { getCategories, getProducts, getProductDetail } from '../../controllers/ecom/productController.js';

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
 *           enum: [price_asc, price_desc, newest]
 *         description: Sort products (price ascending, price descending, or newest)
 *     responses:
 *       200:
 *         description: Successfully retrieved list of products
 */
router.get('/', getProducts);

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
 *         description: Product ID or Slug
 *     responses:
 *       200:
 *         description: Successfully retrieved product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductDetail);

export default router;