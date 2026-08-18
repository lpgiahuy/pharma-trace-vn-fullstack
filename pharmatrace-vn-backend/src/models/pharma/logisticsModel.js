import prisma, { serializeBigInt } from '../../config/prisma.js';
import pool from '../../config/db.js';

const callTransferProcedure = async (tu_don_vi_id, den_don_vi_id, mang_uid) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    await prisma.$queryRawUnsafe(
        `CALL sp_luan_chuyen_kho($1::INT, $2::INT, $3::UUID[])`,
        Number(tu_don_vi_id), Number(den_don_vi_id), pgArrayString
    );
    return true;
};

const createStockTransferRequest = async (tu_don_vi_id, den_don_vi_id, mang_uid, ly_do = '', don_gia = 0, po_code = '') => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(`
            UPDATE public.hopthuoc
            SET trang_thai = 'DangLuanChuyen'
            WHERE uid = ANY($1::uuid[]) AND don_vi_hien_tai_id = $2
        `, [mang_uid, Number(tu_don_vi_id)]);

        let statusNote = don_gia ? `DangVanChuyen|price:${don_gia}` : 'DangVanChuyen';
        if (po_code) {
            statusNote += `|po:${po_code}`;
        }

        const transferTimestamp = new Date();

        for (const uid of mang_uid) {
            await client.query(`
                INSERT INTO public.lichsuphanphoi (hop_thuoc_uid, tu_don_vi_id, den_don_vi_id, loai_giao_dich, ghi_chu, thoi_gian)
                VALUES ($1, $2, $3, 'LuanChuyen', $4, $5)
            `, [uid, Number(tu_don_vi_id), Number(den_don_vi_id), statusNote, transferTimestamp]);
        }

        await client.query('COMMIT');
        return {
            so_luong_chuyen: mang_uid.length,
            tu_kho: Number(tu_don_vi_id),
            den_kho: Number(den_don_vi_id),
            trang_thai: 'DangVanChuyen'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const confirmStockTransferReceipt = async (tu_don_vi_id, den_don_vi_id, mang_uid) => {
    const pgArrayString = `{${mang_uid.join(',')}}`;
    await prisma.$queryRawUnsafe(
        `CALL sp_luan_chuyen_kho($1::INT, $2::INT, $3::UUID[])`,
        Number(tu_don_vi_id), Number(den_don_vi_id), pgArrayString
    );
    await pool.query(`
        UPDATE public.lichsuphanphoi
        SET ghi_chu = 'HoanThanh' || COALESCE(SUBSTRING(ghi_chu FROM '\\|.*'), '')
        WHERE hop_thuoc_uid = ANY($1::uuid[]) AND den_don_vi_id = $2 AND (ghi_chu = 'DangVanChuyen' OR ghi_chu LIKE 'DangVanChuyen%')
    `, [mang_uid, Number(den_don_vi_id)]);
    return true;
};

const getTransferHistory = async (filter = null) => {
    let whereClause = ' WHERE ls.den_don_vi_id IS NOT NULL AND ls.tu_don_vi_id IS NOT NULL AND ls.loai_giao_dich = \'LuanChuyen\' ';
    const params = [];
    if (filter && typeof filter === 'object') {
        if (filter.tu_don_vi_id) {
            params.push(Number(filter.tu_don_vi_id));
            whereClause += ` AND ls.tu_don_vi_id = $${params.length} `;
        } else if (filter.den_don_vi_id) {
            params.push(Number(filter.den_don_vi_id));
            whereClause += ` AND ls.den_don_vi_id = $${params.length} `;
        } else if (filter.don_vi_id) {
            params.push(Number(filter.don_vi_id));
            whereClause += ` AND (ls.tu_don_vi_id = $${params.length} OR ls.den_don_vi_id = $${params.length}) `;
        }
    } else if (filter) {
        params.push(Number(filter));
        whereClause += ` AND ls.tu_don_vi_id = $${params.length} `;
    }
    const query = `
        SELECT 
            MIN(ls.id) AS id,
            ls.tu_don_vi_id,
            dv_tu.ten_don_vi AS ten_tu_kho,
            ls.den_don_vi_id,
            dv_den.ten_don_vi AS ten_den_kho,
            ls.ghi_chu AS trang_thai,
            MIN(ls.thoi_gian) AS thoi_gian,
            COUNT(DISTINCT ls.hop_thuoc_uid)::int AS so_luong_hop,
            lt.so_lo,
            dp.ten_thuoc AS ten_duoc_pham,
            COALESCE(
                (SELECT ten_don_vi FROM public.quycachdonggoi WHERE duoc_pham_id = dp.id ORDER BY id ASC LIMIT 1),
                'Hộp'
            ) AS don_vi_tinh,
            COALESCE(
                NULLIF(SPLIT_PART(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), '|', 1), ''),
                '0'
            )::numeric AS don_gia,
            (COUNT(DISTINCT ls.hop_thuoc_uid)::int * COALESCE(
                NULLIF(SPLIT_PART(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), '|', 1), ''),
                '0'
            )::numeric) AS tong_tien,
            NULLIF(SPLIT_PART(MAX(ls.ghi_chu), 'po:', 2), '') AS po_code,
            array_agg(DISTINCT ls.hop_thuoc_uid) AS mang_uid
        FROM public.lichsuphanphoi ls
        LEFT JOIN public.donvi dv_tu ON ls.tu_don_vi_id = dv_tu.id
        LEFT JOIN public.donvi dv_den ON ls.den_don_vi_id = dv_den.id
        LEFT JOIN public.hopthuoc h ON ls.hop_thuoc_uid = h.uid
        LEFT JOIN public.lothuoc lt ON h.lo_thuoc_id = lt.id
        LEFT JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
        ${whereClause}
        GROUP BY ls.tu_don_vi_id, dv_tu.ten_don_vi, ls.den_don_vi_id, dv_den.ten_don_vi, ls.ghi_chu, lt.so_lo, dp.ten_thuoc, dp.id, ls.thoi_gian
        ORDER BY MIN(ls.thoi_gian) DESC;
    `;
    const { rows } = await pool.query(query, params);
    return rows;
};

const getPendingIncomingTransfers = async (den_don_vi_id) => {
    const query = `
        SELECT 
            MIN(ls.id) AS id,
            ls.tu_don_vi_id,
            dv_tu.ten_don_vi AS ten_tu_kho,
            ls.den_don_vi_id,
            dv_den.ten_don_vi AS ten_den_kho,
            'DangVanChuyen' AS trang_thai,
            MIN(ls.thoi_gian) AS thoi_gian,
            COUNT(DISTINCT ls.hop_thuoc_uid)::int AS so_luong_hop,
            lt.so_lo,
            dp.ten_thuoc AS ten_duoc_pham,
            COALESCE(
                (SELECT ten_don_vi FROM public.quycachdonggoi WHERE duoc_pham_id = dp.id ORDER BY id ASC LIMIT 1),
                'Hộp'
            ) AS don_vi_tinh,
            COALESCE(
                NULLIF(SPLIT_PART(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), '|', 1), ''),
                '0'
            )::numeric AS don_gia,
            (COUNT(DISTINCT ls.hop_thuoc_uid)::int * COALESCE(
                NULLIF(SPLIT_PART(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), '|', 1), ''),
                '0'
            )::numeric) AS tong_tien,
            NULLIF(SPLIT_PART(MAX(ls.ghi_chu), 'po:', 2), '') AS po_code,
            array_agg(DISTINCT ls.hop_thuoc_uid) AS mang_uid
        FROM public.lichsuphanphoi ls
        LEFT JOIN public.donvi dv_tu ON ls.tu_don_vi_id = dv_tu.id
        LEFT JOIN public.donvi dv_den ON ls.den_don_vi_id = dv_den.id
        LEFT JOIN public.hopthuoc h ON ls.hop_thuoc_uid = h.uid
        LEFT JOIN public.lothuoc lt ON h.lo_thuoc_id = lt.id
        LEFT JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
        WHERE ls.loai_giao_dich = 'LuanChuyen'
          AND ls.den_don_vi_id = $1
          AND (ls.ghi_chu = 'DangVanChuyen' OR ls.ghi_chu LIKE 'DangVanChuyen%')
        GROUP BY ls.tu_don_vi_id, dv_tu.ten_don_vi, ls.den_don_vi_id, dv_den.ten_don_vi, ls.ghi_chu, lt.so_lo, dp.ten_thuoc, dp.id, ls.thoi_gian
        ORDER BY MIN(ls.thoi_gian) DESC;
    `;
    const { rows } = await pool.query(query, [Number(den_don_vi_id)]);
    return rows;
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
        SELECT DISTINCT d.id, d.ten_thuoc,
            COALESCE(
                (SELECT ten_don_vi FROM quycachdonggoi WHERE duoc_pham_id = d.id ORDER BY id ASC LIMIT 1),
                'Hộp'
            ) AS don_vi_tinh,
            COUNT(h.uid) AS so_hop_trong_kho
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
        SELECT l.id, l.so_lo, l.han_su_dung,
            COALESCE(
                (SELECT ten_don_vi FROM quycachdonggoi WHERE duoc_pham_id = l.duoc_pham_id ORDER BY id ASC LIMIT 1),
                'Hộp'
            ) AS don_vi_tinh,
            COUNT(h.uid) AS so_hop_trong_kho
        FROM HopThuoc h
        JOIN LoThuoc l ON h.lo_thuoc_id = l.id
        WHERE h.don_vi_hien_tai_id = $1
          AND l.duoc_pham_id = $2
          AND h.trang_thai = 'TrongKho'
        GROUP BY l.id, l.so_lo, l.han_su_dung, l.duoc_pham_id
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

const getInitialInbounds = async (unitId) => {
    const query = `
        SELECT 
            MIN(ls.id) AS id,
            ls.tu_don_vi_id,
            COALESCE(dv.ten_don_vi, 'Khai báo nhập lô mới') AS ten_nha_cung_cap,
            COUNT(DISTINCT ls.hop_thuoc_uid)::int AS so_luong_hop,
            lt.so_lo,
            dp.ten_thuoc AS ten_duoc_pham,
            COALESCE(
                (SELECT ten_don_vi FROM public.quycachdonggoi WHERE duoc_pham_id = dp.id ORDER BY id ASC LIMIT 1),
                'Hộp'
            ) AS don_vi_tinh,
            lt.id AS lo_thuoc_id,
            COALESCE(
                NULLIF(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), ''),
                '0'
            )::numeric AS don_gia,
            (COUNT(DISTINCT ls.hop_thuoc_uid)::int * COALESCE(
                NULLIF(SPLIT_PART(MAX(ls.ghi_chu), 'price:', 2), ''),
                '0'
            )::numeric) AS tong_tien,
            MIN(ls.thoi_gian) AS thoi_gian
        FROM public.lichsuphanphoi ls
        JOIN public.hopthuoc h ON ls.hop_thuoc_uid = h.uid
        JOIN public.lothuoc lt ON h.lo_thuoc_id = lt.id
        JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
        LEFT JOIN public.donvi dv ON ls.tu_don_vi_id = dv.id
        WHERE ls.tu_don_vi_id = $1 AND ls.loai_giao_dich = 'KhoiTao'
        GROUP BY ls.tu_don_vi_id, dv.ten_don_vi, lt.id, lt.so_lo, dp.ten_thuoc, dp.id, ls.thoi_gian
        ORDER BY MIN(ls.thoi_gian) DESC;
    `;
    const { rows } = await pool.query(query, [Number(unitId)]);
    return rows;
};

const cancelStockTransferRequest = async (transferId, mang_uid = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        let targetUids = (Array.isArray(mang_uid) && mang_uid.length > 0) ? mang_uid : null;
        let tu_don_vi_id = null;

        if (!targetUids) {
            const targetRes = await client.query(`
                SELECT id, tu_don_vi_id, den_don_vi_id, thoi_gian, hop_thuoc_uid
                FROM public.lichsuphanphoi 
                WHERE id = $1
            `, [Number(transferId)]);
            
            if (targetRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }

            tu_don_vi_id = targetRes.rows[0].tu_don_vi_id;
            const thoi_gian = targetRes.rows[0].thoi_gian;

            const uidsRes = await client.query(`
                SELECT hop_thuoc_uid
                FROM public.lichsuphanphoi
                WHERE tu_don_vi_id = $1 
                  AND loai_giao_dich = 'LuanChuyen'
                  AND (ghi_chu LIKE 'DangVanChuyen%' OR ghi_chu = 'DangVanChuyen')
                  AND DATE_TRUNC('second', thoi_gian) = DATE_TRUNC('second', $2::timestamp)
            `, [tu_don_vi_id, thoi_gian]);

            targetUids = uidsRes.rows.map(r => r.hop_thuoc_uid);
        } else {
            const unitRes = await client.query(`
                SELECT tu_don_vi_id FROM public.lichsuphanphoi WHERE hop_thuoc_uid = $1 AND loai_giao_dich = 'LuanChuyen' ORDER BY thoi_gian DESC LIMIT 1
            `, [targetUids[0]]);
            if (unitRes.rows.length > 0) {
                tu_don_vi_id = unitRes.rows[0].tu_don_vi_id;
            }
        }

        if (targetUids && targetUids.length > 0) {
            if (tu_don_vi_id) {
                await client.query(`
                    UPDATE public.hopthuoc
                    SET trang_thai = 'TrongKho', don_vi_hien_tai_id = $2
                    WHERE uid = ANY($1::uuid[])
                `, [targetUids, Number(tu_don_vi_id)]);
            } else {
                await client.query(`
                    UPDATE public.hopthuoc
                    SET trang_thai = 'TrongKho'
                    WHERE uid = ANY($1::uuid[])
                `, [targetUids]);
            }

            await client.query(`
                UPDATE public.lichsuphanphoi
                SET ghi_chu = 'DaHuy'
                WHERE hop_thuoc_uid = ANY($1::uuid[]) 
                  AND loai_giao_dich = 'LuanChuyen'
                  AND (ghi_chu LIKE 'DangVanChuyen%' OR ghi_chu = 'DangVanChuyen')
            `, [targetUids]);
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export {
    callTransferProcedure,
    createStockTransferRequest,
    confirmStockTransferReceipt,
    cancelStockTransferRequest,
    getTransferHistory,
    getPendingIncomingTransfers,
    getInitialInbounds,
    disposeMedicine,
    returnMedicine,
    recallBatch,
    getAllUnits,
    getProductsInUnit,
    getBatchesInUnit,
    getUIDsForTransfer,
};