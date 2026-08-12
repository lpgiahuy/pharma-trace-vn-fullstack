-- ==========================================================
-- Module 3: Quản lý Vận Chuyển & Đối Soát Tiền COD
-- Sub-system: PharmaTrace VN
-- ==========================================================

-- 1. Bảng Quản lý Vận Đơn & Đối Soát COD (Shipment Tracking & COD Reconciliation)
CREATE TABLE IF NOT EXISTS public.vanchuyen (
    id SERIAL PRIMARY KEY,
    don_hang_id INTEGER NOT NULL REFERENCES public.donhang(id) ON DELETE CASCADE,
    ma_van_don VARCHAR(50) NOT NULL UNIQUE,
    don_vi_van_chuyen VARCHAR(100) NOT NULL DEFAULT 'DoiXeNoiBo',
    trang_thai_giao VARCHAR(50) DEFAULT 'ChoLayHang' CHECK (trang_thai_giao IN ('ChoLayHang', 'DangVanChuyen', 'GiaoThanhCong', 'GiaoThatBai', 'TraHang')),
    tien_cod NUMERIC(12,2) DEFAULT 0 CHECK (tien_cod >= 0),
    trang_thai_cod VARCHAR(50) DEFAULT 'ChuaDoiSoat' CHECK (trang_thai_cod IN ('ChuaDoiSoat', 'DaDoiSoat', 'KhieuNai')),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ngay_giao_thuc_te TIMESTAMP WITH TIME ZONE
);

-- Index tối ưu truy vấn vận đơn
CREATE INDEX IF NOT EXISTS idx_vanchuyen_donhang ON public.vanchuyen(don_hang_id);
CREATE INDEX IF NOT EXISTS idx_vanchuyen_trangthaigiao ON public.vanchuyen(trang_thai_giao);
CREATE INDEX IF NOT EXISTS idx_vanchuyen_trangthaicod ON public.vanchuyen(trang_thai_cod);

-- 2. Kích hoạt RLS Security cho bảng vanchuyen
ALTER TABLE public.vanchuyen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanchuyen FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_vanchuyen_mod ON public.vanchuyen;
CREATE POLICY p_vanchuyen_mod ON public.vanchuyen FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- 3. Dữ liệu mẫu thử nghiệm Vận đơn & COD (Sample Test Data)
INSERT INTO public.vanchuyen (don_hang_id, ma_van_don, don_vi_van_chuyen, trang_thai_giao, tien_cod, trang_thai_cod)
SELECT 
    dh.id,
    'SHIP-' || dh.id || '-' || FLOOR(RANDOM() * 89999 + 10000)::TEXT,
    CASE (dh.id % 4)
        WHEN 0 THEN 'GHN'
        WHEN 1 THEN 'GHTK'
        WHEN 2 THEN 'ViettelPost'
        ELSE 'DoiXeNoiBo'
    END,
    CASE (dh.id % 3)
        WHEN 0 THEN 'ChoLayHang'
        WHEN 1 THEN 'DangVanChuyen'
        ELSE 'GiaoThanhCong'
    END,
    CASE WHEN dh.phuong_thuc_thanh_toan = 'COD' THEN dh.tong_tien ELSE 0 END,
    'ChuaDoiSoat'
FROM public.donhang dh
LIMIT 5
ON CONFLICT DO NOTHING;
