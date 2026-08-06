import * as kienHangService from '../../services/pharma/kienHangService.js';

/**
 * POST /kien-hang
 * Create a new KienHang and optionally assign medicine box UIDs to it.
 */
const createBundle = async (req, res, next) => {
    try {
        const data = await kienHangService.createBundle(req.body);
        res.status(201).json({
            success: true,
            message: `Bundle created successfully. ${data.so_hop_da_gan} medicine boxes assigned.`,
            data,
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        next(error);
    }
};

/**
 * POST /kien-hang/transfer
 * Scan a KienHang SSCC and transfer all its contents to another warehouse in one operation.
 */
const transferBundle = async (req, res, next) => {
    try {
        const data = await kienHangService.transferBundle(req.body);
        res.status(200).json({
            success: true,
            message: `Successfully transferred ${data.so_luong_hop_chuyen} boxes from bundle "${data.ma_sscc}" to warehouse ID ${data.den_don_vi_id}.`,
            data,
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        next(error);
    }
};

/**
 * GET /kien-hang/:sscc
 * Get full detail of a KienHang by its SSCC — includes all medicine boxes inside.
 */
const getBundleDetail = async (req, res, next) => {
    try {
        const data = await kienHangService.getBundleDetail(req.params.sscc);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        next(error);
    }
};

/**
 * GET /kien-hang
 * List all KienHang. SuperAdmin sees all.
 * QuanLyKho sees only bundles belonging to their own don_vi (from JWT).
 */
const listBundles = async (req, res, next) => {
    try {
        // SuperAdmin can pass ?don_vi_id=X to filter; otherwise sees all
        // QuanLyKho is automatically filtered to their own don_vi_id from JWT
        const isSuperAdmin = req.user?.vai_tro === 'SuperAdmin';
        const don_vi_id = isSuperAdmin
            ? (req.query.don_vi_id || null)
            : req.user?.don_vi_id;

        const data = await kienHangService.listBundles(don_vi_id);
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

/**
 * PATCH /kien-hang/:sscc/status
 * Update KienHang status (e.g. 'DangGiao' → 'DaNhan').
 */
const updateBundleStatus = async (req, res, next) => {
    try {
        const { trang_thai } = req.body;
        if (!trang_thai) {
            res.status(400);
            throw new Error('trang_thai is required.');
        }
        const data = await kienHangService.updateBundleStatus(req.params.sscc, trang_thai);
        res.status(200).json({ success: true, message: 'Bundle status updated.', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        next(error);
    }
};

/**
 * GET /kien-hang/:sscc/resolve-uids
 * Resolve an SSCC to the full array of active medicine box UIDs inside.
 * Useful for frontend needing to call UID-based operations after scanning a pallet.
 */
const resolveSSCCToUIDs = async (req, res, next) => {
    try {
        const uids = await kienHangService.resolveSSCCToUIDs(req.params.sscc);
        res.status(200).json({
            success: true,
            ma_sscc: req.params.sscc,
            so_luong: uids.length,
            mang_uid: uids,
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        else res.status(400);
        next(error);
    }
};

export { createBundle, transferBundle, getBundleDetail, listBundles, updateBundleStatus, resolveSSCCToUIDs };
