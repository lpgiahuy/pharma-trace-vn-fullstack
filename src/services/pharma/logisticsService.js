import * as logisticsModel from '../../models/pharma/logisticsModel.js';

const transferStock = async (payload) => {
    const { tu_don_vi_id, den_don_vi_id, mang_uid } = payload;

    // check required fields
    if (tu_don_vi_id === den_don_vi_id) {
        const error = new Error('Source and destination warehouses cannot be the same!');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(mang_uid) || mang_uid.length === 0) {
        const error = new Error('Invalid or empty list of medicine box UIDs!');
        error.statusCode = 400;
        throw error;
    }

    // limiting to 5000 boxes per transfer to prevent potential memory issues with very large arrays
    if (mang_uid.length > 5000) {
        const error = new Error('Exceeded transfer limit! Only up to 5000 boxes per transfer are supported.');
        error.statusCode = 400;
        throw error;
    }

    // call model function to execute the stored procedure for stock transfer
    await logisticsModel.callTransferProcedure(tu_don_vi_id, den_don_vi_id, mang_uid);

    return {
        so_luong_chuyen: mang_uid.length,
        tu_kho: tu_don_vi_id,
        den_kho: den_don_vi_id
    };
};

const processDisposal = async (payload) => {
    const { don_vi_id, mang_uid, ly_do } = payload;

    if (!don_vi_id || !Array.isArray(mang_uid) || mang_uid.length === 0 || !ly_do) {
        const error = new Error('Missing information! Need unit ID, list of QR codes (mang_uid), and reason for disposal.');
        error.statusCode = 400;
        throw error;
    }

    await logisticsModel.disposeMedicine(don_vi_id, mang_uid, ly_do);
    
    return {
        thong_diep: 'Successfully processed disposal. Items have been marked for disposal!',
        so_luong_huy: mang_uid.length,
        ly_do: ly_do
    };
};

const processRMA = async (payload) => {
    const { don_hang_id, don_vi_nhan_id, mang_uid } = payload;

    if (!don_hang_id || !don_vi_nhan_id || !Array.isArray(mang_uid) || mang_uid.length === 0) {
        const error = new Error('Missing information! Need order ID, return warehouse ID, and list of QR codes (mang_uid).');
        error.statusCode = 400;
        throw error;
    }

    await logisticsModel.returnMedicine(don_hang_id, don_vi_nhan_id, mang_uid);

    return {
        thong_diep: 'Successfully processed return. Items have been restocked!',
        don_hang_id: don_hang_id,
        so_luong_nhap_lai: mang_uid.length
    };
};

const processBatchRecall = async (lo_thuoc_id) => {
    if (!lo_thuoc_id) {
        const error = new Error('Please provide the ID of the medicine batch to recall!');
        error.statusCode = 400; throw error;
    }
    await logisticsModel.recallBatch(lo_thuoc_id);
    return { message: `Successfully initiated emergency recall for Batch ${lo_thuoc_id} across the entire system!` };
};

const fetchAllUnits = async () => {
    return await logisticsModel.getAllUnits();
};

const fetchProductsInUnit = async (don_vi_id) => {
    if (!don_vi_id) {
        const error = new Error('Thiếu ID đơn vị');
        error.statusCode = 400;
        throw error;
    }
    return await logisticsModel.getProductsInUnit(don_vi_id);
};

const fetchBatchesInUnit = async (don_vi_id, duoc_pham_id) => {
    if (!don_vi_id || !duoc_pham_id) {
        const error = new Error('Thiếu ID đơn vị hoặc ID sản phẩm');
        error.statusCode = 400;
        throw error;
    }
    return await logisticsModel.getBatchesInUnit(don_vi_id, duoc_pham_id);
};

const fetchUIDsForTransfer = async (don_vi_id, lo_thuoc_id, so_luong) => {
    if (!don_vi_id || !lo_thuoc_id || !so_luong) {
        const error = new Error('Thiếu thông tin để lấy danh sách UID');
        error.statusCode = 400;
        throw error;
    }
    return await logisticsModel.getUIDsForTransfer(don_vi_id, lo_thuoc_id, so_luong);
};

export {
    transferStock,
    processDisposal,
    processRMA,
    processBatchRecall,
    fetchAllUnits,
    fetchProductsInUnit,
    fetchBatchesInUnit,
    fetchUIDsForTransfer,
};