import express from 'express';
import { uploadPrescription } from '../../controllers/ecom/prescriptionCtrl.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { upload } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Ecom - Prescriptions
 *     description: Quản lý toa thuốc khách hàng tải lên để Dược sĩ xét duyệt
 */

/**
 * @swagger
 * /prescriptions/upload:
 *   post:
 *     summary: Tải lên hình ảnh toa thuốc
 *     description: Yêu cầu Token Khách hàng. Khách hàng gửi ảnh chụp toa thuốc kèm theo thông tin bác sĩ, bệnh viện (nếu có). Sử dụng định dạng `multipart/form-data`.
 *     tags:
 *       - Ecom - Prescriptions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hinh_anh
 *             properties:
 *               hinh_anh:
 *                 type: string
 *                 format: binary
 *                 description: File hình ảnh chụp toa thuốc (jpg, jpeg, png...)
 *               ten_bac_si:
 *                 type: string
 *                 example: "Bs. Nguyễn Văn A"
 *                 description: Tên bác sĩ kê đơn (Tùy chọn)
 *               ten_benh_vien:
 *                 type: string
 *                 example: "Bệnh viện Đại học Y Dược"
 *                 description: Nơi khám bệnh (Tùy chọn)
 *               chuan_doan:
 *                 type: string
 *                 example: "Viêm họng cấp, ho có đờm"
 *                 description: Chuẩn đoán của bác sĩ ghi trên toa (Tùy chọn)
 *     responses:
 *       201:
 *         description: Tải lên toa thuốc thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Gửi toa thuốc thành công! Vui lòng chờ Dược sĩ của chúng tôi xét duyệt."
 *               data:
 *                 id: 1
 *                 hinh_anh_toa: "/uploads/1711440000000-toathuoc.jpg"
 *                 trang_thai_duyet: "ChoDuyet"
 *                 ngay_tao: "2024-03-26T10:00:00.000Z"
 *       400:
 *         description: Lỗi thiếu file hình ảnh toa thuốc
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Vui lòng tải lên hình ảnh toa thuốc!"
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn
 */
router.post('/upload', protect, upload.single('hinh_anh'), uploadPrescription);

export default router;