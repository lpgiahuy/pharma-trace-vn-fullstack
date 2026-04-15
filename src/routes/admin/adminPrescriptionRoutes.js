import express from 'express';
import { getList, updateStatus } from '../../controllers/admin/adminPrescriptionCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Prescriptions
 *     description: Quản lý và xét duyệt toa thuốc do khách hàng tải lên (Dành cho Dược sĩ, Admin, Bán hàng)
 */

// BẢO MẬT: Phải đăng nhập và có Role Dược sĩ (hoặc Admin/Bán hàng) mới được xem và duyệt toa
router.use(protect);
router.use(authorizeRoles('SuperAdmin', 'NhanVienBanHang'));

/**
 * @swagger
 * /admin/prescriptions:
 *   get:
 *     summary: Lấy danh sách toa thuốc
 *     description: Yêu cầu Token (SuperAdmin, DuocSi, BanHang). Trả về danh sách toa thuốc kèm thông tin khách hàng. Hỗ trợ lọc theo trạng thái duyệt.
 *     tags:
 *       - Admin - Prescriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ChoDuyet, HopLe, TuChoi]
 *         description: Lọc danh sách theo trạng thái (Để trống nếu muốn lấy toàn bộ)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   hinh_anh_toa: "/uploads/1711440000000-toathuoc.jpg"
 *                   ten_bac_si: "Bs. Nguyễn Văn A"
 *                   ten_benh_vien: "Bệnh viện Chợ Rẫy"
 *                   chuan_doan: "Viêm họng cấp"
 *                   ngay_tao: "2024-03-26T10:00:00.000Z"
 *                   trang_thai_duyet: "ChoDuyet"
 *                   ten_khach_hang: "Nguyễn Văn Khách"
 *                   so_dien_thoai: "0901234567"
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn
 *       403:
 *         description: Không có quyền truy cập (Role không hợp lệ)
 */
router.get('/', getList);

/**
 * @swagger
 * /admin/prescriptions/{id}/status:
 *   put:
 *     summary: Xét duyệt toa thuốc (Hợp lệ / Từ chối)
 *     description: Yêu cầu Token (SuperAdmin, DuocSi, BanHang). Dược sĩ kiểm tra hình ảnh toa thuốc và quyết định duyệt hay từ chối.
 *     tags:
 *       - Admin - Prescriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của toa thuốc cần xét duyệt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai_duyet
 *             properties:
 *               trang_thai_duyet:
 *                 type: string
 *                 enum: [ChoDuyet, HopLe, TuChoi]
 *                 example: "HopLe"
 *                 description: Trạng thái duyệt mới
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Đã cập nhật toa thuốc thành công: HopLe"
 *               data:
 *                 id: 1
 *                 trang_thai_duyet: "HopLe"
 *       400:
 *         description: Trạng thái truyền lên không hợp lệ
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Trạng thái không hợp lệ! Chỉ nhận: ChoDuyet, HopLe, TuChoi."
 *       404:
 *         description: Không tìm thấy toa thuốc
 */
router.put('/:id/status', updateStatus);

export default router;