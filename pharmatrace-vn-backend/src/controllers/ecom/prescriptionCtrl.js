import * as prescriptionService from '../../services/ecom/prescriptionService.js';

export const uploadPrescription = async (req, res, next) => {
    try {
        const data = await prescriptionService.submitPrescription(req.user.id, req.file, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully! Please wait for our pharmacist to review it.',
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export const getMyPrescriptions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const data = await prescriptionService.fetchUserPrescriptions(req.user.id, parseInt(page), parseInt(limit));
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};