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
            message: `Tạo yêu cầu chuyển kho thành công cho ${data.so_luong_chuyen} hộp thuốc. Đang chờ kho nhận xác nhận!`,
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        
        next(error);
    }
};

const getTransferHistory = async (req, res, next) => {
    try {
        const { tu_don_vi_id, den_don_vi_id, don_vi_id } = req.query;
        let filter = null;
        if (tu_don_vi_id) filter = { tu_don_vi_id };
        else if (den_don_vi_id) filter = { den_don_vi_id };
        else if (don_vi_id) filter = { don_vi_id };
        else if (req.user?.don_vi_id) filter = { tu_don_vi_id: req.user.don_vi_id };

        const data = await logisticsService.getTransferHistoryService(filter);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getPendingIncomingTransfers = async (req, res, next) => {
    try {
        const unitId = req.query.don_vi_id || req.user?.don_vi_id;
        if (!unitId) {
            return res.status(200).json({ success: true, data: [] });
        }
        const data = await logisticsService.getPendingIncomingTransfersService(unitId);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getInitialInbounds = async (req, res, next) => {
    try {
        const unitId = req.query.don_vi_id || req.user?.don_vi_id;
        if (!unitId) {
            return res.status(200).json({ success: true, data: [] });
        }
        const data = await logisticsService.getInitialInboundsService(unitId);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const confirmTransferReceipt = async (req, res, next) => {
    try {
        const data = await logisticsService.confirmTransferReceiptService(req.body);
        res.status(200).json({ success: true, message: 'Đã xác nhận nhận hàng và cập nhật tồn kho thành công!', data });
    } catch (error) { next(error); }
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

const getProductsInUnit = async (req, res, next) => {
    try {
        const data = await logisticsService.fetchProductsInUnit(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getBatchesInUnit = async (req, res, next) => {
    try {
        const data = await logisticsService.fetchBatchesInUnit(req.params.id, req.query.duoc_pham_id);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getUIDsForTransfer = async (req, res, next) => {
    try {
        const data = await logisticsService.fetchUIDsForTransfer(req.params.id, req.query.lo_thuoc_id, parseInt(req.query.so_luong));
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const cancelStockTransfer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mang_uid } = req.body || {};
        const result = await logisticsService.cancelTransferService(id, mang_uid);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

export {
    transferWarehouse,
    getTransferHistory,
    getPendingIncomingTransfers,
    getInitialInbounds,
    confirmTransferReceipt,
    cancelStockTransfer,
    handleDisposal,
    handleRMA,
    handleBatchRecall,
    getAllLogisticsUnits,
    getProductsInUnit,
    getBatchesInUnit,
    getUIDsForTransfer,
};