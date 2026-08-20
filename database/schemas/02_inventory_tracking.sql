-- ========================================================
-- Schema: 02_inventory_tracking.sql
-- Modules: Lots/Batches, Drug Box UIDs, SSCC Pallets, Warehouses, Stock
-- ========================================================

-- 1. Batches / Lots (Lô thuốc)
CREATE TABLE IF NOT EXISTS public.lothuoc (
    id SERIAL PRIMARY KEY,
    so_lo VARCHAR(100) NOT NULL UNIQUE,
    duoc_pham_id INTEGER REFERENCES public.duocpham(id) ON DELETE CASCADE,
    nha_san_xuat_id INTEGER REFERENCES public.donvi(id),
    ngay_san_xuat DATE NOT NULL,
    han_su_dung DATE NOT NULL,
    so_luong_nhap INTEGER NOT NULL DEFAULT 0,
    so_luong_con_lai INTEGER NOT NULL DEFAULT 0,
    trang_thai VARCHAR(50) DEFAULT 'BINH_THUONG',
    certificate_co_cq TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SSCC Logistics Master Cartons (Kiện hàng logistics)
CREATE TABLE IF NOT EXISTS public.kienhang_sscc (
    id SERIAL PRIMARY KEY,
    ma_sscc VARCHAR(50) NOT NULL UNIQUE,
    lo_thuoc_id INTEGER REFERENCES public.lothuoc(id),
    don_vi_hien_tai_id INTEGER REFERENCES public.donvi(id),
    trang_thai VARCHAR(50) DEFAULT 'DONG_GOI',
    so_luong_hop INTEGER DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Individual Box Serialized UIDs (Mã định danh hộp thuốc)
CREATE TABLE IF NOT EXISTS public.mahop_uid (
    uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lo_thuoc_id INTEGER REFERENCES public.lothuoc(id) ON DELETE CASCADE,
    kien_hang_id INTEGER REFERENCES public.kienhang_sscc(id) ON DELETE SET NULL,
    don_vi_hien_tai_id INTEGER REFERENCES public.donvi(id) ON DELETE SET NULL,
    trang_thai VARCHAR(50) DEFAULT 'TRONG_KHO',
    signature TEXT,
    public_key TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Facility Inventory Balance (Tồn kho theo đơn vị)
CREATE TABLE IF NOT EXISTS public.tonkho_donvi (
    id SERIAL PRIMARY KEY,
    don_vi_id INTEGER REFERENCES public.donvi(id) ON DELETE CASCADE,
    duoc_pham_id INTEGER REFERENCES public.duocpham(id) ON DELETE CASCADE,
    quy_cach_id INTEGER REFERENCES public.quycachdonggoi(id),
    so_luong_ton INTEGER NOT NULL DEFAULT 0,
    so_luong_cho_giao INTEGER DEFAULT 0,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tonkho_donvi UNIQUE(don_vi_id, duoc_pham_id, quy_cach_id)
);

-- 5. Inventory Transaction History (Lịch sử biến động tồn kho)
CREATE TABLE IF NOT EXISTS public.lichsu_tonkho (
    id SERIAL PRIMARY KEY,
    don_vi_id INTEGER REFERENCES public.donvi(id),
    duoc_pham_id INTEGER REFERENCES public.duocpham(id),
    loai_bien_dong VARCHAR(50) NOT NULL,
    so_luong_thay_doi INTEGER NOT NULL,
    so_luong_truoc INTEGER NOT NULL,
    so_luong_sau INTEGER NOT NULL,
    ma_tham_chieu VARCHAR(100),
    ghi_chu TEXT,
    nguoi_thuc_hien_id INTEGER REFERENCES public.nguoidung(id),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
