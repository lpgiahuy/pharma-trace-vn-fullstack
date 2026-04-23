import * as kienHangModel from '../../models/pharma/kienHangModel.js';

/**
 * Create a new KienHang and optionally assign UIDs to it immediately.
 */
const createBundle = async (payload) => {
    const { ma_sscc, loai_kien, don_vi_so_huu_id, mang_uid } = payload;

    if (!ma_sscc || !loai_kien || !don_vi_so_huu_id) {
        const err = new Error('Missing required fields: ma_sscc, loai_kien, don_vi_so_huu_id.');
        err.statusCode = 400;
        throw err;
    }
    if (!['Thung', 'Pallet'].includes(loai_kien)) {
        const err = new Error('loai_kien must be either "Thung" or "Pallet".');
        err.statusCode = 400;
        throw err;
    }

    const newBundle = await kienHangModel.createKienHang(ma_sscc, loai_kien, don_vi_so_huu_id);

    // Optionally assign medicine boxes to this bundle upon creation
    let assignedCount = 0;
    if (Array.isArray(mang_uid) && mang_uid.length > 0) {
        if (mang_uid.length > 5000) {
            const err = new Error('Cannot assign more than 5,000 boxes to a single bundle at once.');
            err.statusCode = 400;
            throw err;
        }
        const assigned = await kienHangModel.assignUIDsToKienHang(newBundle.id, mang_uid);
        assignedCount = assigned.length;
    }

    return {
        kien_hang: newBundle,
        so_hop_da_gan: assignedCount,
    };
};

/**
 * Transfer an entire KienHang (Pallet/Thùng) to another warehouse unit by scanning its SSCC QR code.
 * Calls the DB stored procedure which handles all 5000+ boxes atomically in a single transaction.
 */
const transferBundle = async (payload) => {
    const { ma_sscc, den_don_vi_id } = payload;

    if (!ma_sscc || !den_don_vi_id) {
        const err = new Error('Missing required fields: ma_sscc, den_don_vi_id.');
        err.statusCode = 400;
        throw err;
    }

    // Verify the bundle exists before calling the procedure
    const existingBundle = await kienHangModel.getKienHangBySSCC(ma_sscc);
    if (!existingBundle) {
        const err = new Error(`KienHang with SSCC "${ma_sscc}" not found.`);
        err.statusCode = 404;
        throw err;
    }
    if (existingBundle.don_vi_so_huu_id === parseInt(den_don_vi_id)) {
        const err = new Error('Source and destination warehouses cannot be the same.');
        err.statusCode = 400;
        throw err;
    }

    // Call the single SP which atomically updates KienHang, all HopThuoc locations, and logs
    await kienHangModel.callTransferKienHangProcedure(ma_sscc, den_don_vi_id);

    return {
        ma_sscc,
        so_luong_hop_chuyen: existingBundle.so_luong_hop,
        tu_don_vi: existingBundle.ten_don_vi_so_huu,
        den_don_vi_id,
    };
};

/**
 * Get full detail of a KienHang by scanning its SSCC (including all medicine boxes inside).
 */
const getBundleDetail = async (ma_sscc) => {
    const bundle = await kienHangModel.getKienHangBySSCC(ma_sscc);
    if (!bundle) {
        const err = new Error(`KienHang with SSCC "${ma_sscc}" not found.`);
        err.statusCode = 404;
        throw err;
    }
    return bundle;
};

/**
 * Get all bundles for a specific warehouse unit, or all bundles if SuperAdmin.
 */
const listBundles = async (don_vi_id = null) => {
    if (don_vi_id) {
        return kienHangModel.getKienHangByDonVi(don_vi_id);
    }
    return kienHangModel.getAllKienHang();
};

/**
 * Update the status of a KienHang (e.g. mark as 'DaNhan' after delivery).
 */
const updateBundleStatus = async (ma_sscc, trang_thai) => {
    const validStatuses = ['SanSang', 'DangGiao', 'DaNhan', 'DaRaLe'];
    if (!validStatuses.includes(trang_thai)) {
        const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}.`);
        err.statusCode = 400;
        throw err;
    }

    const updated = await kienHangModel.updateKienHangStatus(ma_sscc, trang_thai);
    if (!updated) {
        const err = new Error(`KienHang with SSCC "${ma_sscc}" not found.`);
        err.statusCode = 404;
        throw err;
    }
    return updated;
};

/**
 * Resolve a KienHang SSCC to a list of individual medicine box UIDs.
 * Useful when a client scans a pallet but needs to call a UID-based operation.
 */
const resolveSSCCToUIDs = async (ma_sscc) => {
    const uids = await kienHangModel.getUIDsBySSCC(ma_sscc);
    if (!uids || uids.length === 0) {
        const err = new Error(`No active medicine boxes found inside KienHang "${ma_sscc}".`);
        err.statusCode = 404;
        throw err;
    }
    return uids;
};

export { createBundle, transferBundle, getBundleDetail, listBundles, updateBundleStatus, resolveSSCCToUIDs };
