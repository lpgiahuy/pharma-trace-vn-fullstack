import * as inventoryModel from '../../models/pharma/inventoryModel.js';

const importNewBatch = async (payload) => {
    const { duoc_pham_id, don_vi_id, so_lo, ngay_sx, hsd, so_luong_hop } = payload;

    // Validate input data
    if (new Date(ngay_sx) >= new Date(hsd)) {
        const error = new Error('Expiration date must be after the manufacturing date.');
        error.statusCode = 400;
        throw error;
    }

    if (so_luong_hop <= 0 || so_luong_hop > 50000) {
        const error = new Error('Quantity imported per batch must be between 1 and 50,000 boxes to ensure QR code generation performance.');
        error.statusCode = 400;
        throw error;
    }

    // Call the Stored Procedure to handle all inventory updates in one go
    const newBatch = await inventoryModel.callImportProcedure(
        duoc_pham_id, don_vi_id, so_lo, ngay_sx, hsd, so_luong_hop
    );

    // After the procedure, check the current inventory level for this product at this unit
    const inventory = await inventoryModel.checkInventory(don_vi_id, duoc_pham_id);

    return {
        lo_thuoc_moi: newBatch,
        so_luong_da_sinh_qr: so_luong_hop,
        ton_kho_hien_tai: inventory ? inventory.so_luong_ton : so_luong_hop
    };
};

export { importNewBatch };
