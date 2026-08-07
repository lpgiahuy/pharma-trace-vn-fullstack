import prisma, { serializeBigInt } from '../../config/prisma.js';

/**
 * Create a new KienHang (bundle/pallet) record.
 */
const createKienHang = async (ma_sscc, loai_kien, don_vi_so_huu_id) => {
    const result = await prisma.kienhang.create({
        data: { ma_sscc, loai_kien, don_vi_so_huu_id: Number(don_vi_so_huu_id) }
    });
    return serializeBigInt(result);
};

/**
 * Get a single KienHang record + the list of medicine box UIDs inside it.
 */
const getKienHangBySSCC = async (ma_sscc) => {
    const bundle = await prisma.kienhang.findUnique({
        where: { ma_sscc },
        include: { donvi: { select: { ten_don_vi: true } } }
    });
    if (!bundle) return null;

    const boxes = await prisma.$queryRawUnsafe(`
        SELECT ht.uid, ht.trang_thai, lt.so_lo, lt.han_su_dung, dp.ten_thuoc
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        JOIN DuocPham dp ON lt.duoc_pham_id = dp.id
        WHERE ht.kien_hang_id = $1
        ORDER BY dp.ten_thuoc ASC;
    `, bundle.id);

    return serializeBigInt({
        ...bundle,
        ten_don_vi_so_huu: bundle.donvi?.ten_don_vi || null,
        donvi: undefined,
        so_luong_hop: boxes.length,
        danh_sach_hop: boxes
    });
};

/**
 * Get all KienHang records belonging to a specific warehouse unit.
 */
const getKienHangByDonVi = async (don_vi_id) => {
    const result = await prisma.$queryRawUnsafe(`
        SELECT kh.*, 
               dv.ten_don_vi AS ten_don_vi_so_huu,
               COUNT(ht.uid) AS so_luong_hop
        FROM KienHang kh
        LEFT JOIN DonVi dv ON kh.don_vi_so_huu_id = dv.id
        LEFT JOIN HopThuoc ht ON kh.id = ht.kien_hang_id
        WHERE kh.don_vi_so_huu_id = $1
        GROUP BY kh.id, dv.ten_don_vi
        ORDER BY kh.ngay_tao DESC;
    `, Number(don_vi_id));
    return serializeBigInt(result);
};

/**
 * Get all KienHang (for SuperAdmin view).
 */
const getAllKienHang = async () => {
    const result = await prisma.$queryRawUnsafe(`
        SELECT kh.*, 
               dv.ten_don_vi AS ten_don_vi_so_huu,
               COUNT(ht.uid) AS so_luong_hop
        FROM KienHang kh
        LEFT JOIN DonVi dv ON kh.don_vi_so_huu_id = dv.id
        LEFT JOIN HopThuoc ht ON kh.id = ht.kien_hang_id
        GROUP BY kh.id, dv.ten_don_vi
        ORDER BY kh.ngay_tao DESC;
    `);
    return serializeBigInt(result);
};

/**
 * Assign a batch of medicine box UIDs to a KienHang (by kien_hang_id).
 */
const assignUIDsToKienHang = async (kien_hang_id, mang_uid) => {
    const pgArray = `{${mang_uid.join(',')}}`;
    const result = await prisma.$queryRawUnsafe(
        `UPDATE HopThuoc SET kien_hang_id = $1 WHERE uid = ANY($2::UUID[]) RETURNING uid;`,
        Number(kien_hang_id), pgArray
    );
    return result;
};

/**
 * Resolve SSCC → array of active UIDs.
 */
const getUIDsBySSCC = async (ma_sscc) => {
    const result = await prisma.$queryRawUnsafe(`
        SELECT ht.uid
        FROM HopThuoc ht
        JOIN KienHang kh ON ht.kien_hang_id = kh.id
        WHERE kh.ma_sscc = $1
          AND ht.trang_thai NOT IN ('HuyBo', 'ThuHoi');
    `, ma_sscc);
    return result.map(r => r.uid);
};

/**
 * Call the database stored procedure to transfer an entire KienHang to another unit.
 */
const callTransferKienHangProcedure = async (ma_sscc, den_don_vi_id) => {
    await prisma.$queryRawUnsafe(
        `CALL sp_luan_chuyen_kien_hang($1::VARCHAR, $2::INT)`,
        ma_sscc, Number(den_don_vi_id)
    );
    return true;
};

/**
 * Update KienHang status.
 */
const updateKienHangStatus = async (ma_sscc, trang_thai) => {
    const result = await prisma.kienhang.update({
        where: { ma_sscc },
        data: { trang_thai }
    });
    return serializeBigInt(result);
};

export {
    createKienHang,
    getKienHangBySSCC,
    getKienHangByDonVi,
    getAllKienHang,
    assignUIDsToKienHang,
    getUIDsBySSCC,
    callTransferKienHangProcedure,
    updateKienHangStatus,
};
