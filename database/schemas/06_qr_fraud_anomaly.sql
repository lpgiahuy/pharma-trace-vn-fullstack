-- ========================================================
-- Schema: 06_qr_fraud_anomaly.sql
-- Modules: QR Scan Verification Logs & Geo/Velocity Fraud Alerts
-- ========================================================

CREATE TABLE IF NOT EXISTS public.lichsu_quet_qr (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL REFERENCES public.mahop_uid(uid) ON DELETE CASCADE,
    nguoi_dung_id INTEGER REFERENCES public.nguoidung(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    dia_chi_ip VARCHAR(50),
    user_agent TEXT,
    thoi_gian_quet TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ket_qua VARCHAR(50) DEFAULT 'HOP_LE',
    diem_rui_ro INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.canhbao_gianlan (
    id SERIAL PRIMARY KEY,
    uid UUID REFERENCES public.mahop_uid(uid) ON DELETE CASCADE,
    loai_gian_lan VARCHAR(100) NOT NULL,
    muc_do_nghiem_trong VARCHAR(50) DEFAULT 'CANH_BAO',
    mo_ta TEXT,
    latitude_1 NUMERIC(10, 7),
    longitude_1 NUMERIC(10, 7),
    latitude_2 NUMERIC(10, 7),
    longitude_2 NUMERIC(10, 7),
    khoang_cach_km DOUBLE PRECISION,
    thoi_gian_giua_hai_lan_quet_phut DOUBLE PRECISION,
    van_toc_kmh DOUBLE PRECISION,
    trang_thai_xu_ly VARCHAR(50) DEFAULT 'CHUA_XU_LY',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lichsu_quet_qr_uid ON public.lichsu_quet_qr(uid);
CREATE INDEX IF NOT EXISTS idx_canhbao_gianlan_uid ON public.canhbao_gianlan(uid);
