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

export { importInventory };