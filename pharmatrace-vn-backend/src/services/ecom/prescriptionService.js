import * as prescriptionModel from '../../models/ecom/prescriptionModel.js';

export const submitPrescription = async (khach_hang_id, file, body) => {
    if (!file) {
        const error = new Error('Please upload a prescription image!');
        error.statusCode = 400;
        throw error;
    }

    const hinh_anh_toa = `/uploads/${file.filename}`;
    const { ten_bac_si, ten_benh_vien, chuan_doan } = body;

    return await prescriptionModel.createPrescription(
        khach_hang_id, hinh_anh_toa, ten_bac_si, ten_benh_vien, chuan_doan
    );
};

export const fetchUserPrescriptions = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return await prescriptionModel.getPrescriptionsByUserId(userId, limit, offset);
};