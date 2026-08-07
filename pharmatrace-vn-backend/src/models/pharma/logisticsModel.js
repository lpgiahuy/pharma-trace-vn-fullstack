import prisma, { serializeBigInt } from '../../config/prisma.js';

const callTransferProcedure = async (tu_don_vi_id, den_don_vi_id, mang_uid) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    await prisma.$queryRawUnsafe(
        `CALL sp_luan_chuyen_kho($1::INT, $2::INT, $3::UUID[])`,
        Number(tu_don_vi_id), Number(den_don_vi_id), pgArrayString
    );
    return true;
};

// dispose of damaged or expired medicine boxes
const disposeMedicine = async (don_vi_id, mang_uid, ly_do) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    await prisma.$queryRawUnsafe(
        `CALL sp_xuat_huy_thuoc($1::INT, $2::UUID[], $3::TEXT)`,
        Number(don_vi_id), pgArrayString, ly_do
    );
    return true;
};

// return medicine from customer back to warehouse
const returnMedicine = async (don_hang_id, don_vi_nhan_id, mang_uid) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    await prisma.$queryRawUnsafe(
        `CALL sp_hoan_tra_thuoc($1::INT, $2::INT, $3::UUID[])`,
        Number(don_hang_id), Number(don_vi_nhan_id), pgArrayString
    );
    return true;
};

// recall entire batch of medicine
const recallBatch = async (lo_thuoc_id) => {
    await prisma.$queryRawUnsafe(`CALL sp_thu_hoi_lo_thuoc($1::INT)`, Number(lo_thuoc_id));
    return true;
};

const getAllUnits = async () => {
    const units = await prisma.donvi.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, ten_don_vi: true, loai_don_vi: true, dia_chi: true }
    });
    return units;
};

const getProductsInUnit = async (don_vi_id) => {
    const result = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT d.id, d.ten_thuoc, COUNT(h.uid) AS so_hop_trong_kho
        FROM HopThuoc h
        JOIN LoThuoc l ON h.lo_thuoc_id = l.id
        JOIN DuocPham d ON l.duoc_pham_id = d.id
        WHERE h.don_vi_hien_tai_id = $1
          AND h.trang_thai = 'TrongKho'
        GROUP BY d.id, d.ten_thuoc
        ORDER BY d.ten_thuoc ASC
    `, Number(don_vi_id));
    return serializeBigInt(result);
};

const getBatchesInUnit = async (don_vi_id, duoc_pham_id) => {
    const result = await prisma.$queryRawUnsafe(`
        SELECT l.id, l.so_lo, l.han_su_dung, COUNT(h.uid) AS so_hop_trong_kho
        FROM HopThuoc h
        JOIN LoThuoc l ON h.lo_thuoc_id = l.id
        WHERE h.don_vi_hien_tai_id = $1
          AND l.duoc_pham_id = $2
          AND h.trang_thai = 'TrongKho'
        GROUP BY l.id, l.so_lo, l.han_su_dung
        ORDER BY l.han_su_dung ASC
    `, Number(don_vi_id), Number(duoc_pham_id));
    return serializeBigInt(result);
};

const getUIDsForTransfer = async (don_vi_id, lo_thuoc_id, so_luong) => {
    const result = await prisma.hopthuoc.findMany({
        where: {
            don_vi_hien_tai_id: Number(don_vi_id),
            lo_thuoc_id: Number(lo_thuoc_id),
            trang_thai: 'TrongKho'
        },
        take: Number(so_luong),
        select: { uid: true }
    });
    return result.map(r => r.uid);
};

export {
    callTransferProcedure,
    disposeMedicine,
    returnMedicine,
    recallBatch,
    getAllUnits,
    getProductsInUnit,
    getBatchesInUnit,
    getUIDsForTransfer,
};