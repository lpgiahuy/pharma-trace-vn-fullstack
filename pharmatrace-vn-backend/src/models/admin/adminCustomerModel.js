import prisma from '../../config/prisma.js';

// Get list of all customers (for admin dashboard)
const getAllCustomers = async () => {
    return await prisma.khachhang.findMany({
        select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            hang_thanh_vien: true,
            diem_tich_luy: true,
            ngay_tao: true,
            trang_thai: true
        },
        orderBy: { ngay_tao: 'desc' }
    });
};

// Get customer detail by ID (includes order stats)
const getCustomerDetail = async (id) => {
    const customerId = Number(id);
    const customer = await prisma.khachhang.findUnique({
        where: { id: customerId },
        select: {
            id: true,
            ho_ten: true,
            so_dien_thoai: true,
            email: true,
            dia_chi_mac_dinh: true,
            hang_thanh_vien: true,
            diem_tich_luy: true,
            ngay_tao: true,
            trang_thai: true
        }
    });
    if (!customer) return null;

    // Retrieve order statistics using Prisma queries and simple JS aggregation
    const orders = await prisma.donhang.findMany({
        where: { khach_hang_id: customerId },
        select: {
            tong_tien: true,
            trang_thai_don: true
        }
    });

    const tong_don_hang = orders.length;
    let tong_chi_tieu = 0;
    let don_hoan_thanh = 0;
    let don_da_huy = 0;

    orders.forEach(o => {
        tong_chi_tieu += Number(o.tong_tien || 0);
        if (o.trang_thai_don === 'HoanThanh') don_hoan_thanh++;
        if (o.trang_thai_don === 'DaHuy') don_da_huy++;
    });

    customer.thong_ke_don_hang = {
        tong_don_hang,
        tong_chi_tieu,
        don_hoan_thanh,
        don_da_huy
    };

    return customer;
};

// Toggle account status: lock (FALSE) / unlock (TRUE)
const setCustomerStatus = async (id, trang_thai) => {
    return await prisma.khachhang.update({
        where: { id: Number(id) },
        data: { trang_thai: Boolean(trang_thai) },
        select: {
            id: true,
            ho_ten: true,
            trang_thai: true
        }
    });
};

export { getAllCustomers, getCustomerDetail, setCustomerStatus };
