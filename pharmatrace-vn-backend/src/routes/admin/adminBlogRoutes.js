import express from 'express';
import {
    getPublicBlogs, getPublicBlogDetail,
    createNewBlog, updateExistingBlog, deleteExistingBlog
} from '../../controllers/admin/adminBlogCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Blogs
 *     description: Blog and news management (Health articles, promotions, etc.)
 */

// ==============================================================================
// 1. PUBLIC API (No authentication required)
// ==============================================================================
/**
 * @swagger
 * /admin/blogs/public:
 *   get:
 *     summary: Get list of all published blog posts (For customers)
 *     description: Public endpoint - no authentication required. Returns all blog posts sorted by newest first, including author name.
 *     tags: [Admin - Blogs]
 *     responses:
 *       200:
 *         description: Successfully retrieved blog posts
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   tieu_de: "5 Ways to Protect Your Health During Flu Season"
 *                   anh_bia: "https://example.com/blog-covid.jpg"
 *                   noi_dung: "Detailed content of the article goes here..."
 *                   ngay_dang: "2024-03-24T10:00:00.000Z"
 *                   nguoi_dang: "Nguyễn Văn Giám Đốc"
 */
router.get('/public', getPublicBlogs);

/**
 * @swagger
 * /admin/blogs/public/{id}:
 *   get:
 *     summary: Get detailed information of a blog post
 *     description: Public endpoint - no authentication required. Used to load full blog content when customer clicks on a post.
 *     tags: [Admin - Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the blog post
 *     responses:
 *       200:
 *         description: Successfully retrieved blog post details
 *       404:
 *         description: Blog post not found
 */
router.get('/public/:id', getPublicBlogDetail);

// ==============================================================================
// 2. AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==============================================================================
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang')); // Only Admin and Sales staff can create/edit blogs

// ==============================================================================
// 3. ADMIN MANAGEMENT API
// ==============================================================================
/**
 * @swagger
 * /admin/blogs/add:
 *   post:
 *     summary: Create a new blog post
 *     description: Requires authentication (SuperAdmin or BanHang). Author ID is automatically taken from the JWT token.
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tieu_de
 *               - noi_dung
 *             properties:
 *               tieu_de:
 *                 type: string
 *                 example: "Proper Antibiotic Usage Guidelines"
 *               anh_bia:
 *                 type: string
 *                 example: "https://example.com/cover.jpg"
 *                 description: Cover image URL for the blog post
 *               noi_dung:
 *                 type: string
 *                 example: "<p>Antibiotics are medications used to treat bacterial infections...</p>"
 *                 description: Full content of the post (usually HTML from rich text editor)
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       400:
 *         description: Missing title or content
 *       403:
 *         description: Insufficient permissions
 */
router.post('/add', createNewBlog);

/**
 * @swagger
 * /admin/blogs/{id}:
 *   put:
 *     summary: Update an existing blog post
 *     description: Supports partial updates.
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the blog post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tieu_de:
 *                 type: string
 *                 example: "Proper Antibiotic Usage Guidelines (Updated)"
 *               anh_bia:
 *                 type: string
 *               noi_dung:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       404:
 *         description: Blog post not found
 */
router.put('/:id', updateExistingBlog);

/**
 * @swagger
 * /admin/blogs/{id}:
 *   delete:
 *     summary: Hard delete a blog post
 *     tags: [Admin - Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the blog post to delete
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       404:
 *         description: Blog post not found
 */
router.delete('/:id', deleteExistingBlog);

export default router;