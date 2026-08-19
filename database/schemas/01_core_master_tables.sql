-- ========================================================
-- Schema: 01_core_master_tables.sql
-- Modules: Categories, Packaging Units, Facilities, Users, Drugs Catalog
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Packaging Units (Quy cách đóng gói)
CREATE TABLE IF NOT EXISTS public.quycachdonggoi (
    id SERIAL PRIMARY KEY,
    ten_don_vi VARCHAR(50) NOT NULL UNIQUE,
    mo_ta TEXT
);

-- 2. Categories (Danh mục dược phẩm)
CREATE TABLE IF NOT EXISTS public.danhmuc (
    id SERIAL PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    mo_ta TEXT,
    icon VARCHAR(100)
);

-- 3. Facilities / Branches (Đơn vị cơ sở / Kho / Chi nhánh)
CREATE TABLE IF NOT EXISTS public.donvi (
    id SERIAL PRIMARY KEY,
    ten_don_vi VARCHAR(150) NOT NULL,
    loai_don_vi VARCHAR(50) NOT NULL,
    dia_chi TEXT,
    so_dien_thoai VARCHAR(20),
    email VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users (Người dùng hệ thống)
CREATE TABLE IF NOT EXISTS public.nguoidung (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    so_dien_thoai VARCHAR(20),
    vai_tro VARCHAR(50) NOT NULL DEFAULT 'KHACH_HANG',
    trang_thai VARCHAR(50) DEFAULT 'HOAT_DONG',
    don_vi_id INTEGER REFERENCES public.donvi(id) ON DELETE SET NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Profile (Khách hàng)
CREATE TABLE IF NOT EXISTS public.khachhang (
    id SERIAL PRIMARY KEY,
    nguoi_dung_id INTEGER UNIQUE REFERENCES public.nguoidung(id) ON DELETE CASCADE,
    hang_thanh_vien VARCHAR(50) DEFAULT 'DONG',
    diem_tich_luy INTEGER DEFAULT 0,
    dia_chi_mac_dinh TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Staff Profile (Nhân viên)
CREATE TABLE IF NOT EXISTS public.nhanvien (
    id SERIAL PRIMARY KEY,
    nguoi_dung_id INTEGER UNIQUE REFERENCES public.nguoidung(id) ON DELETE CASCADE,
    don_vi_id INTEGER REFERENCES public.donvi(id) ON DELETE SET NULL,
    chuc_vu VARCHAR(100),
    ngay_vao_lam DATE DEFAULT CURRENT_DATE
);

-- 7. Pharmaceutical Drug Catalog (Dược phẩm)
CREATE TABLE IF NOT EXISTS public.duocpham (
    id SERIAL PRIMARY KEY,
    ten_thuoc VARCHAR(255) NOT NULL,
    danh_muc_id INTEGER REFERENCES public.danhmuc(id) ON DELETE SET NULL,
    quy_cach_id INTEGER REFERENCES public.quycachdonggoi(id) ON DELETE SET NULL,
    so_dang_ky VARCHAR(100),
    hoat_chat TEXT,
    ham_luong VARCHAR(100),
    hang_san_xuat VARCHAR(150),
    nuoc_san_xuat VARCHAR(100),
    don_gia NUMERIC(15, 2) NOT NULL DEFAULT 0,
    don_gia_khuyen_mai NUMERIC(15, 2),
    hinh_anh TEXT,
    mo_ta_ngan TEXT,
    chi_tiet_thuoc JSONB DEFAULT '{}'::jsonb,
    is_ke_don BOOLEAN DEFAULT FALSE,
    trang_thai VARCHAR(50) DEFAULT 'KINH_DOANH',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
