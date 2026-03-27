import * as prescriptionService from '../../services/ecom/prescriptionService.js';

export const uploadPrescription = async (req, res, next) => {
    try {
        // req.user.id có được nhờ đi qua middleware protect (xác thực token)
        // req.file có được nhờ đi qua middleware upload.single() của multer
        const data = await prescriptionService.submitPrescription(req.user.id, req.file, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Gửi toa thuốc thành công! Vui lòng chờ Dược sĩ của chúng tôi xét duyệt.',
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};