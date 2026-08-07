import prisma, { serializeBigInt } from '../../config/prisma.js';

const callImportProcedure = async (duocPhamId, donViId, soLo, ngaySx, hsd, soLuong, quyCachId = null) => {
    // If quy_cach_id is not provided, default to the first packaging unit of the product
    let finalQuyCachId = quyCachId ? Number(quyCachId) : null;
    if (!finalQuyCachId) {
        const qc = await prisma.quycachdonggoi.findFirst({
            where: { duoc_pham_id: Number(duocPhamId) },
            orderBy: { id: 'asc' },
            select: { id: true }
        });
        if (!qc) {
            const err = new Error(`Thuốc ID ${duocPhamId} chưa có quy cách đóng gói. Vui lòng thêm quy cách trước khi nhập kho.`);
            err.statusCode = 400;
            throw err;
        }
        finalQuyCachId = qc.id;
    }

    // Step 1: Create a new LoThuoc record
    const loThuoc = await prisma.lothuoc.create({
        data: {
            duoc_pham_id: Number(duocPhamId),
            quy_cach_id: finalQuyCachId,
            so_lo: soLo,
            ngay_san_xuat: new Date(ngaySx),
            han_su_dung: new Date(hsd)
        },
        select: { id: true, so_lo: true, ngay_san_xuat: true, han_su_dung: true, trang_thai: true }
    });

    // Step 2: Call stored procedure to generate HopThuoc (UID) and update TonKho
    await prisma.$queryRawUnsafe(
        `CALL sp_nhap_kho_lo_thuoc_moi($1::INT, $2::INT, $3::INT)`,
        loThuoc.id, Number(donViId), Number(soLuong)
    );

    return loThuoc;
};

const checkInventory = async (donViId, duocPhamId) => {
    const result = await prisma.tonkho.findFirst({
        where: { don_vi_id: Number(donViId), duoc_pham_id: Number(duocPhamId) },
        select: { so_luong_ton: true }
    });
    return result;
};

const getTotalProductStock = async (duocPhamId) => {
    const result = await prisma.tonkho.aggregate({
        where: { duoc_pham_id: Number(duocPhamId) },
        _sum: { so_luong_ton: true }
    });
    return Number(result._sum.so_luong_ton || 0);
};

/**
 * @deprecated THIS FUNCTION IS DEPRECATED.
 * Do NOT use this function to deduct stock anymore.
 * Inventory deduction is now automatically handled by the database trigger `trg_tru_ton_kho`
 * when an order item is inserted into `ChiTietDonHang`.
 */
const deductStock = async (duocPhamId, baseQuantity) => {
    const units = await prisma.tonkho.findMany({
        where: { duoc_pham_id: Number(duocPhamId), so_luong_ton: { gt: 0 } },
        orderBy: { so_luong_ton: 'desc' }
    });

    let remaining = baseQuantity;
    for (const unit of units) {
        if (remaining <= 0) break;
        const deductAmount = Math.min(Number(unit.so_luong_ton), remaining);
        await prisma.tonkho.update({
            where: { don_vi_id_duoc_pham_id: { don_vi_id: unit.don_vi_id, duoc_pham_id: unit.duoc_pham_id } },
            data: { so_luong_ton: { decrement: deductAmount }, ngay_cap_nhat: new Date() }
        });
        remaining -= deductAmount;
    }

    if (remaining > 0) {
        throw new Error(`Insufficient stock for product ID ${duocPhamId}. Still need ${remaining} units.`);
    }
    return true;
};

const getBoxesByBatch = async (batchId) => {
    const boxes = await prisma.hopthuoc.findMany({
        where: { lo_thuoc_id: Number(batchId) },
        orderBy: { uid: 'asc' },
        select: { uid: true, trang_thai: true }
    });
    return boxes;
};

const getAllBatches = async () => {
    const batches = await prisma.$queryRawUnsafe(`
        SELECT 
            l.id,
            l.so_lo AS "batchNumber",
            l.ngay_san_xuat AS "createdAt",
            l.han_su_dung AS "expiryDate",
            d.ten_thuoc AS "productName",
            (SELECT COUNT(*) FROM HopThuoc WHERE lo_thuoc_id = l.id) AS "quantity"
        FROM LoThuoc l
        JOIN DuocPham d ON l.duoc_pham_id = d.id
        ORDER BY l.id DESC;
    `);
    return serializeBigInt(batches);
};

export { callImportProcedure, checkInventory, getTotalProductStock, deductStock, getBoxesByBatch, getAllBatches };