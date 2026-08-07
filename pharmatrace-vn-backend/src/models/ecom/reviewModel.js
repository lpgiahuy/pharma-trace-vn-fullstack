import prisma from '../../config/prisma.js';

// create a new review for a product by a customer
const createReview = async (khach_hang_id, duoc_pham_id, so_sao, noi_dung) => {
    return await prisma.danhgiasanpham.create({
        data: {
            khach_hang_id: Number(khach_hang_id),
            duoc_pham_id: Number(duoc_pham_id),
            so_sao: Number(so_sao),
            noi_dung
        },
        select: {
            id: true,
            so_sao: true,
            noi_dung: true,
            ngay_danh_gia: true
        }
    });
};

// Get the list of reviews for a specific product (for display on app/web)
const getReviewsByProductId = async (duoc_pham_id) => {
    const reviews = await prisma.danhgiasanpham.findMany({
        where: { duoc_pham_id: Number(duoc_pham_id) },
        include: {
            khachhang: {
                select: { ho_ten: true }
            }
        },
        orderBy: { ngay_danh_gia: 'desc' }
    });

    return reviews.map(r => ({
        id: r.id,
        so_sao: r.so_sao,
        noi_dung: r.noi_dung,
        ngay_danh_gia: r.ngay_danh_gia,
        ten_khach_hang: r.khachhang?.ho_ten || null
    }));
};

export { createReview, getReviewsByProductId };

//