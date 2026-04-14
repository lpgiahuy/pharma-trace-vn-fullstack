import express from 'express';
import { listBlogs, getBlogDetail } from '../../controllers/ecom/blogController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: E-com - Blogs
 *     description: Public blog & health articles (No login required)
 */

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Lấy danh sách bài viết sức khỏe / tin tức
 *     description: Public endpoint — không cần đăng nhập. Trả về tất cả bài viết sắp xếp theo mới nhất.
 *     tags: [E-com - Blogs]
 *     responses:
 *       200:
 *         description: Danh sách bài viết
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
 *                       tieu_de:
 *                         type: string
 *                         example: "5 Cách Bảo Vệ Sức Khỏe Mùa Cúm"
 *                       anh_bia:
 *                         type: string
 *                         example: "https://example.com/cover.jpg"
 *                       ngay_dang:
 *                         type: string
 *                         format: date-time
 *                       nguoi_dang:
 *                         type: string
 *                         example: "Dược sĩ Nguyễn Văn A"
 */
router.get('/', listBlogs);

/**
 * @swagger
 * /blogs/{id}:
 *   get:
 *     summary: Đọc chi tiết một bài viết
 *     description: Public endpoint — không cần đăng nhập. Trả về toàn bộ nội dung bài viết.
 *     tags: [E-com - Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết
 *     responses:
 *       200:
 *         description: Nội dung bài viết
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
 *                     id:
 *                       type: integer
 *                     tieu_de:
 *                       type: string
 *                     noi_dung:
 *                       type: string
 *                       description: Nội dung HTML đầy đủ
 *                     anh_bia:
 *                       type: string
 *                     ngay_dang:
 *                       type: string
 *                       format: date-time
 *                     nguoi_dang:
 *                       type: string
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.get('/:id', getBlogDetail);

export default router;
