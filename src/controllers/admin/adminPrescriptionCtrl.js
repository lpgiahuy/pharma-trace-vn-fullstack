import * as adminPrescriptionService from '../../services/admin/adminPrescriptionService.js';

export const getList = async (req, res, next) => {
    try {
        // Read query params from URL (e.g. ?status=ChoDuyet)
        const { status } = req.query;
        const data = await adminPrescriptionService.fetchPrescriptions(status);
        
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { trang_thai_duyet } = req.body;
        
        const data = await adminPrescriptionService.changePrescriptionStatus(id, trang_thai_duyet);
        
        res.status(200).json({
            success: true,
            message: `Prescription updated successfully: ${trang_thai_duyet}`,
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};