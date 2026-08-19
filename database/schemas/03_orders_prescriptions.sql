-- ========================================================
-- Schema: 03_orders_prescriptions.sql
-- Modules: Electronic Prescriptions, Cart, Orders, Order Details, Vouchers, Reviews, Blog
-- ========================================================

-- 1. Electronic Prescriptions (Toa thuốc điện tử)
CREATE TABLE IF NOT EXISTS public.toathuoc (
    id SERIAL PRIMARY KEY,
    khach_hang_id INTEGER REFERENCES public.khachhang(id) ON DELETE CASCADE,
    bac_si_ke_don VARCHAR(100),
    co_so_kham_benh VARCHAR(150),
    chuan_doan TEXT,
    hinh_anh_don_thuoc TEXT,
    trang_thai VARCHAR(50) DEFAULT 'CHO_DUYET',
    ghi_chu_duoc_si TEXT,
    duoc_si_duyet_id INTEGER REFERENCES public.nguoidung(id),
    ngay_ke DATE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Discount Vouchers (Mã giảm giá)
CREATE TABLE IF NOT EXISTS public.makhuyenmai (
    id SERIAL PRIMARY KEY,
    ma_code VARCHAR(50) NOT NULL UNIQUE,
    loai_giam VARCHAR(20) DEFAULT 'PERCENT',
    gia_tri_giam NUMERIC(15, 2) NOT NULL,
    don_hang_toi_thieu NUMERIC(15, 2) DEFAULT 0,
    giam_toi_da NUMERIC(15, 2),
    so_luong INTEGER DEFAULT 100,
    so_luong_da_dung INTEGER DEFAULT 0,
    ngay_bat_dau TIMESTAMP,
    ngay_ket_thuc TIMESTAMP,
    trang_thai VARCHAR(50) DEFAULT 'HOAT_DONG'
);

-- 3. Orders (Đơn hàng)
CREATE TABLE IF NOT EXISTS public.donhang (
    id SERIAL PRIMARY KEY,
    ma_don_hang VARCHAR(50) NOT NULL UNIQUE,
    khach_hang_id INTEGER REFERENCES public.khachhang(id) ON DELETE SET NULL,
    don_vi_xuat_id INTEGER REFERENCES public.donvi(id),
    toa_thuoc_id INTEGER REFERENCES public.toathuoc(id) ON DELETE SET NULL,
    tong_tien_hang NUMERIC(15, 2) NOT NULL DEFAULT 0,
    phi_van_chuyen NUMERIC(15, 2) DEFAULT 0,
    giam_gia NUMERIC(15, 2) DEFAULT 0,
    diem_su_dung INTEGER DEFAULT 0,
    tong_thanh_toan NUMERIC(15, 2) NOT NULL DEFAULT 0,
    phuong_thuc_thanh_toan VARCHAR(50) DEFAULT 'COD',
    trang_thai_thanh_toan VARCHAR(50) DEFAULT 'CHUA_THANH_TOAN',
    trang_thai_don_hang VARCHAR(50) DEFAULT 'CHO_XU_LY',
    dia_chi_giao_hang TEXT,
    so_dien_thoai_nhan VARCHAR(20),
    ten_nguoi_nhan VARCHAR(100),
    ghi_chu TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Order Items (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS public.chitietdonhang (
    id SERIAL PRIMARY KEY,
    don_hang_id INTEGER REFERENCES public.donhang(id) ON DELETE CASCADE,
    duoc_pham_id INTEGER REFERENCES public.duocpham(id),
    quy_cach_id INTEGER REFERENCES public.quycachdonggoi(id),
    so_luong INTEGER NOT NULL DEFAULT 1,
    don_gia NUMERIC(15, 2) NOT NULL DEFAULT 0,
    thanh_tien NUMERIC(15, 2) NOT NULL DEFAULT 0,
    danh_sach_uid UUID[] DEFAULT '{}'::uuid[]
);

-- 5. Shopping Cart (Giỏ hàng)
CREATE TABLE IF NOT EXISTS public.giohang (
    id SERIAL PRIMARY KEY,
    khach_hang_id INTEGER REFERENCES public.khachhang(id) ON DELETE CASCADE,
    duoc_pham_id INTEGER REFERENCES public.duocpham(id) ON DELETE CASCADE,
    quy_cach_id INTEGER REFERENCES public.quycachdonggoi(id),
    so_luong INTEGER NOT NULL DEFAULT 1,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_giohang_item UNIQUE(khach_hang_id, duoc_pham_id, quy_cach_id)
);

-- 6. Product Reviews (Đánh giá sản phẩm)
CREATE TABLE IF NOT EXISTS public.danhgia_sanpham (
    id SERIAL PRIMARY KEY,
    khach_hang_id INTEGER REFERENCES public.khachhang(id) ON DELETE CASCADE,
    duoc_pham_id INTEGER REFERENCES public.duocpham(id) ON DELETE CASCADE,
    so_sao INTEGER CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung TEXT,
    hinh_anh TEXT[],
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Healthcare Blog (Bài viết y tế)
CREATE TABLE IF NOT EXISTS public.baiviet (
    id SERIAL PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    tom_tat TEXT,
    noi_dung TEXT NOT NULL,
    hinh_anh TEXT,
    tac_gia_id INTEGER REFERENCES public.nguoidung(id),
    luot_xem INTEGER DEFAULT 0,
    trang_thai VARCHAR(50) DEFAULT 'XUAT_BAN',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
