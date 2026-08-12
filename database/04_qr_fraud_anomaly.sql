-- ==========================================================
-- Module 4: Engine Chống Gian Lận QR & Phát Hiện Hàng Giả
-- Sub-system: PharmaTrace VN
-- ==========================================================

SET client_encoding = 'UTF8';

-- 1. Hàm tính khoảng cách địa lý Haversine (tính bằng km giữa 2 tọa độ Lat/Lng)
CREATE OR REPLACE FUNCTION public.fn_haversine_distance(
    lat1 NUMERIC, lng1 NUMERIC,
    lat2 NUMERIC, lng2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC := 6371; -- Bán kính Trái Đất tính bằng km
    dlat NUMERIC;
    dlng NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN 0;
    END IF;

    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    a := SIN(dlat / 2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng / 2)^2;
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    
    RETURN ROUND((r * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Bảng Lưu Vết Cảnh Báo Gian Lận QR (Fraud Anomaly Log)
CREATE TABLE IF NOT EXISTS public.canhbao_gianlan (
    id SERIAL PRIMARY KEY,
    nhatky_id INTEGER REFERENCES public.nhatkyxacthuc(id) ON DELETE SET NULL,
    hop_thuoc_uid UUID NOT NULL,
    loai_canh_bao VARCHAR(50) NOT NULL CHECK (loai_canh_bao IN ('VelocityAnomaly', 'FrequencyAnomaly', 'MultipleIPs')),
    muc_do_rui_ro VARCHAR(20) DEFAULT 'Medium' CHECK (muc_do_rui_ro IN ('Low', 'Medium', 'High', 'Critical')),
    mo_ta TEXT,
    toa_do_lat_truoc NUMERIC(10,8),
    toa_do_lng_truoc NUMERIC(11,8),
    toa_do_lat_sau NUMERIC(10,8),
    toa_do_lng_sau NUMERIC(11,8),
    khoang_cach_km NUMERIC(10,2) DEFAULT 0,
    thoi_gian_chenh_phut NUMERIC(10,2) DEFAULT 0,
    van_toc_kmh NUMERIC(10,2) DEFAULT 0,
    trang_thai VARCHAR(50) DEFAULT 'Moi' CHECK (trang_thai IN ('Moi', 'DangXuLy', 'DaKiemChung', 'BaoDongGia')),
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index tối ưu truy vấn cảnh báo
CREATE INDEX IF NOT EXISTS idx_canhbao_uid ON public.canhbao_gianlan(hop_thuoc_uid);
CREATE INDEX IF NOT EXISTS idx_canhbao_ruiro ON public.canhbao_gianlan(muc_do_rui_ro);
CREATE INDEX IF NOT EXISTS idx_canhbao_trangthai ON public.canhbao_gianlan(trang_thai);

-- 3. Kích hoạt RLS Security cho bảng canhbao_gianlan
ALTER TABLE public.canhbao_gianlan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canhbao_gianlan FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_canhbao_gianlan_mod ON public.canhbao_gianlan;
CREATE POLICY p_canhbao_gianlan_mod ON public.canhbao_gianlan FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- 4. Đảm bảo tồn tại các UID Hộp thuốc thử nghiệm
INSERT INTO public.hopthuoc (uid, lo_thuoc_id, trang_thai)
VALUES 
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid, 1, 'TrongKho'),
    ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'::uuid, 1, 'TrongKho'),
    ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'::uuid, 1, 'TrongKho')
ON CONFLICT (uid) DO NOTHING;

-- 5. Xóa dữ liệu lỗi UTF-8 cũ (nếu có)
DELETE FROM public.canhbao_gianlan;

-- 6. Dữ liệu mẫu thử nghiệm Engine Gian lận
INSERT INTO public.canhbao_gianlan (
    hop_thuoc_uid, loai_canh_bao, muc_do_rui_ro, mo_ta, 
    toa_do_lat_truoc, toa_do_lng_truoc, toa_do_lat_sau, toa_do_lng_sau,
    khoang_cach_km, thoi_gian_chenh_phut, van_toc_kmh, trang_thai
) VALUES 
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'VelocityAnomaly',
    'Critical',
    'Cảnh báo Vận tốc Quét Bất Thường: Mã QR được quét ở Hà Nội và TP.HCM cách nhau 5 phút (Khoảng cách 1,154 km - Vận tốc ước tính 13,848 km/h). Nghi vấn sao chép/in lậu mã QR!',
    21.02851000, 105.85420000, 10.82310000, 106.62970000,
    1154.20, 5.00, 13850.40, 'Moi'
),
(
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'FrequencyAnomaly',
    'High',
    'Bất thường Tần suất Quét: Mã QR này đã được quét 24 lần từ 8 địa chỉ IP khác nhau trong vòng 1 giờ.',
    10.77688000, 106.70089000, 10.77690000, 106.70090000,
    0.05, 12.00, 0.25, 'DangXuLy'
),
(
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'VelocityAnomaly',
    'High',
    'Cảnh báo Quét Vị Trí Cách Biệt: Mã QR quét tại Đà Nẵng và Hải Phòng cách nhau 15 phút (Khoảng cách 535 km).',
    16.05440000, 108.20220000, 20.84490000, 106.68810000,
    535.80, 15.00, 2143.20, 'BaoDongGia'
);
