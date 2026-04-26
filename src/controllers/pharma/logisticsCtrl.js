import * as logisticsService from '../../services/pharma/logisticsService.js';

const transferWarehouse = async (req, res, next) => {
    try {
        const { tu_don_vi_id, den_don_vi_id, mang_uid } = req.body;

        if (!tu_don_vi_id || !den_don_vi_id || !mang_uid) {
            res.status(400);
            throw new Error('Missing required transfer data (from_unit_id, to_unit_id, batch_uid)');
        }

        const data = await logisticsService.transferStock(req.body);

        res.status(200).json({
            success: true,
            message: `Transfer completed successfully! Transferred ${data.so_luong_chuyen} boxes to the new warehouse.`,
            data: data
        });
    } catch (error) {
        // if procedure throws an error, it means some UIDs were invalid or not in the source warehouse
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        
        next(error);
    }
};

const handleDisposal = async (req, res, next) => {
    try {
        const data = await logisticsService.processDisposal(req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        // Procedure wil throw an error if any UID is not in the specified warehouse
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400); 
        next(error);
    }
};

const handleRMA = async (req, res, next) => {
    try {
        const data = await logisticsService.processRMA(req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400); 
        next(error);
    }
};

const handleBatchRecall = async (req, res, next) => {
    try {
        const data = await logisticsService.processBatchRecall(req.params.loThuocId);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getAllLogisticsUnits = async (req, res, next) => {
    try {
        const data = await logisticsService.fetchAllUnits();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

export { 
    transferWarehouse, 
    handleDisposal, 
    handleRMA, 
    handleBatchRecall, 
    getAllLogisticsUnits 
};