-- ========================================================
-- Schema: 05_logistics_cod.sql
-- Modules: Logistics Shipping Orders & COD Status
-- ========================================================

CREATE TABLE IF NOT EXISTS public.vanchuyen (
    id SERIAL PRIMARY KEY,
    don_hang_id INTEGER NOT NULL UNIQUE REFERENCES public.donhang(id) ON DELETE CASCADE,
    ma_van_don VARCHAR(50) NOT NULL UNIQUE,
    don_vi_van_chuyen VARCHAR(100) NOT NULL DEFAULT 'GiaoHangNhanh',
    trang_thai_van_chuyen VARCHAR(50) NOT NULL DEFAULT 'CHO_LAY_HANG',
    ngay_lay_hang TIMESTAMP,
    ngay_giao_du_kien TIMESTAMP,
    ngay_giao_thuc_te TIMESTAMP,
    tien_thu_ho_cod NUMERIC(15, 2) NOT NULL DEFAULT 0,
    trang_thai_cod VARCHAR(50) NOT NULL DEFAULT 'CHUA_DOI_SOAT',
    ngay_doi_soat_cod TIMESTAMP,
    ghi_chu TEXT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vanchuyen_donhang ON public.vanchuyen(don_hang_id);
CREATE INDEX IF NOT EXISTS idx_vanchuyen_trangthaicod ON public.vanchuyen(trang_thai_cod);
