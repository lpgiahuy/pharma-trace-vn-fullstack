-- ==========================================================
-- Module Procurement & Purchase Orders (PO) Schema
-- Sub-system: PharmaTrace VN
-- ==========================================================

-- 1. Bảng Phiếu Nhập Hàng (Header Phiếu Mua Hàng / PO)
CREATE TABLE IF NOT EXISTS public.phieunhap (
    id SERIAL PRIMARY KEY,
    ma_phieu_nhap VARCHAR(50) NOT NULL UNIQUE,
    nha_cung_cap_id INTEGER NOT NULL REFERENCES public.donvi(id) ON DELETE RESTRICT,
    nguoi_tao_id INTEGER REFERENCES public.nhanvien(id) ON DELETE SET NULL,
    tong_tien NUMERIC(15,2) DEFAULT 0 CHECK (tong_tien >= 0),
    trang_thai VARCHAR(50) DEFAULT 'ChoDuyet' CHECK (trang_thai IN ('ChoDuyet', 'DaDuyet', 'DaNhapKho', 'DaHuy')),
    ghi_chu TEXT,
    ngay_nhap TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Chi Tiết Phiếu Nhập Hàng (PO Lines)
CREATE TABLE IF NOT EXISTS public.chitietphieunhap (
    id SERIAL PRIMARY KEY,
    phieu_nhap_id INTEGER NOT NULL REFERENCES public.phieunhap(id) ON DELETE CASCADE,
    duoc_pham_id INTEGER NOT NULL REFERENCES public.duocpham(id) ON DELETE RESTRICT,
    lo_thuoc_id INTEGER REFERENCES public.lothuoc(id) ON DELETE SET NULL,
    quy_cach_id INTEGER REFERENCES public.quycachdonggoi(id) ON DELETE SET NULL,
    so_luong INTEGER NOT NULL CHECK (so_luong > 0),
    don_gia NUMERIC(12,2) NOT NULL CHECK (don_gia >= 0),
    thanh_tien NUMERIC(15,2) GENERATED ALWAYS AS (so_luong * don_gia) STORED
);

-- Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_phieunhap_ncc ON public.phieunhap(nha_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_phieunhap_trangthai ON public.phieunhap(trang_thai);
CREATE INDEX IF NOT EXISTS idx_chitietphieunhap_phieunhap ON public.chitietphieunhap(phieu_nhap_id);
CREATE INDEX IF NOT EXISTS idx_chitietphieunhap_duocpham ON public.chitietphieunhap(duoc_pham_id);
