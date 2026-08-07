import prisma, { serializeBigInt } from '../../config/prisma.js';

// get wishlist of a customer
const getWishlist = async (khach_hang_id) => {
    const query = `
        SELECT 
            dp.id, 
            dp.ten_thuoc, 
            dp.hinh_anh_url, 
            dp.mo_ta_ngan, 
            dp.la_thuoc_ke_don,
            dp.so_luong_da_ban,
            dp.diem_danh_gia,
            qc.gia_ban, 
            qc.ten_don_vi AS don_vi_ban,
            spy.ngay_them,
            (SELECT COALESCE(SUM(so_luong_ton), 0) FROM TonKho WHERE duoc_pham_id = dp.id) AS total_stock
        FROM SanPhamYeuThich spy
        JOIN DuocPham dp ON spy.duoc_pham_id = dp.id
        LEFT JOIN QuyCachDongGoi qc ON dp.id = qc.duoc_pham_id AND qc.id = (SELECT MIN(id) FROM QuyCachDongGoi WHERE duoc_pham_id = dp.id)
        WHERE spy.khach_hang_id = $1
        ORDER BY spy.ngay_them DESC;
    `;
    const result = await prisma.$queryRawUnsafe(query, Number(khach_hang_id));
    return serializeBigInt(result);
};

// add product to wishlist (using ON CONFLICT to avoid duplicates)
const addToWishlist = async (khach_hang_id, duoc_pham_id) => {
    const query = `
        INSERT INTO SanPhamYeuThich (khach_hang_id, duoc_pham_id)
        VALUES ($1, $2)
        ON CONFLICT (khach_hang_id, duoc_pham_id) DO NOTHING
        RETURNING *;
    `;
    const result = await prisma.$queryRawUnsafe(query, Number(khach_hang_id), Number(duoc_pham_id));
    return result.length > 0;
};

// remove product from wishlist 
const removeFromWishlist = async (khach_hang_id, duoc_pham_id) => {
    try {
        const deleted = await prisma.sanphamyeuthich.delete({
            where: {
                khach_hang_id_duoc_pham_id: {
                    khach_hang_id: Number(khach_hang_id),
                    duoc_pham_id: Number(duoc_pham_id)
                }
            }
        });
        return !!deleted;
    } catch (e) {
        return false;
    }
};

// check if a product is in wishlist
const checkIfFavorited = async (khach_hang_id, duoc_pham_id) => {
    const fav = await prisma.sanphamyeuthich.findUnique({
        where: {
            khach_hang_id_duoc_pham_id: {
                khach_hang_id: Number(khach_hang_id),
                duoc_pham_id: Number(duoc_pham_id)
            }
        }
    });
    return !!fav;
};

export { getWishlist, addToWishlist, removeFromWishlist, checkIfFavorited };