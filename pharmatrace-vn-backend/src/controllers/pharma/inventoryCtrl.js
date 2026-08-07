import * as inventoryService from '../../services/pharma/inventoryService.js';

const importInventory = async (req, res, next) => {
    try {
        const { duoc_pham_id, don_vi_id, so_lo, ngay_sx, hsd, so_luong_hop } = req.body;

        if (!duoc_pham_id || !don_vi_id || !so_lo || !ngay_sx || !hsd || !so_luong_hop) {
            res.status(400);
            throw new Error('Missing required inventory data (product code, unit code, batch number, manufacturing date, expiration date, quantity)');
        }

        const data = await inventoryService.importNewBatch(req.body);

        res.status(201).json({
            success: true,
            message: `Import inventory successful! The system has automatically generated ${req.body.so_luong_hop} unique QR codes for this batch of medication.`,
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const getBatchQRs = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        if (!batchId) {
            res.status(400);
            throw new Error('Missing required batchId parameter.');
        }

        const data = await inventoryService.getBatchQRDetails(batchId);

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const getInventoryList = async (req, res, next) => {
    try {
        const data = await inventoryService.fetchInventoryList();
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { importInventory, getBatchQRs, getInventoryList };