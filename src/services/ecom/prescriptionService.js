import * as prescriptionModel from '../../models/ecom/prescriptionModel.js';

export const submitPrescription = async (khach_hang_id, file, body) => {
    if (!file) {
        const error = new Error('Vui lòng tải lên hình ảnh toa thuốc!');
        error.statusCode = 400;
        throw error;
    }

    // Đường dẫn ảo để lưu vào DB (Frontend sẽ dùng link này để hiển thị ảnh)
    const hinh_anh_toa = `/uploads/${file.filename}`;
    const { ten_bac_si, ten_benh_vien, chuan_doan } = body;

    return await prescriptionModel.createPrescription(
        khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan
    );
};