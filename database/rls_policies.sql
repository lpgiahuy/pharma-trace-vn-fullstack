-- =============================================================================
-- Row Level Security (RLS) Policies for PharmaTrace VN
-- =============================================================================

-- 0. Create Application Database Role (non-superuser for RLS enforcement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'HuyLe@574406';
    END IF;
END $$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;

-- 1. Helper function for RLS Bypass
CREATE OR REPLACE FUNCTION rls_can_bypass()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        current_setting('app.bypass_rls', true) = 'on'
        OR current_setting('app.current_user_role', true) IN ('Admin', 'SuperAdmin')
        -- Allow queries when no session user context is specified (e.g. initial connection / migrations)
        OR (
            NULLIF(current_setting('app.current_user_id', true), '') IS NULL
            AND NULLIF(current_setting('app.current_user_type', true), '') IS NULL
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current numeric user ID
CREATE OR REPLACE FUNCTION rls_current_user_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get current numeric unit ID
CREATE OR REPLACE FUNCTION rls_current_unit_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_unit_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 2. Customer Domain Tables (Isolation by khach_hang_id)
-- =============================================================================

-- Table: chitietgiohang
ALTER TABLE chitietgiohang ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietgiohang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_chitietgiohang ON chitietgiohang;
CREATE POLICY p_chitietgiohang ON chitietgiohang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR khach_hang_id = rls_current_user_id()
);

-- Table: donhang
ALTER TABLE donhang ENABLE ROW LEVEL SECURITY;
ALTER TABLE donhang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_donhang ON donhang;
CREATE POLICY p_donhang ON donhang
FOR ALL USING (
    rls_can_bypass()
    OR khach_hang_id = rls_current_user_id()
    OR (
        current_setting('app.current_user_type', true) = 'staff'
        AND (
            EXISTS (
                SELECT 1 FROM chitietdonhang ctdh
                WHERE ctdh.don_hang_id = donhang.id
                AND ctdh.don_vi_xuat_id = rls_current_unit_id()
            )
            OR EXISTS (
                SELECT 1 FROM hopthuoc ht
                WHERE ht.don_hang_id = donhang.id
                AND ht.don_vi_hien_tai_id = rls_current_unit_id()
            )
            OR NOT EXISTS (
                SELECT 1 FROM chitietdonhang ctdh
                WHERE ctdh.don_hang_id = donhang.id
                AND ctdh.don_vi_xuat_id IS NOT NULL
            )
        )
    )
);

-- Table: chitietdonhang
ALTER TABLE chitietdonhang ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietdonhang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_chitietdonhang ON chitietdonhang;
CREATE POLICY p_chitietdonhang ON chitietdonhang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR EXISTS (
        SELECT 1 FROM donhang
        WHERE donhang.id = chitietdonhang.don_hang_id
        AND donhang.khach_hang_id = rls_current_user_id()
    )
);

-- Table: phieutrahang
ALTER TABLE phieutrahang ENABLE ROW LEVEL SECURITY;
ALTER TABLE phieutrahang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_phieutrahang ON phieutrahang;
CREATE POLICY p_phieutrahang ON phieutrahang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR khach_hang_id = rls_current_user_id()
);

-- Table: chitietphieutrahang
ALTER TABLE chitietphieutrahang ENABLE ROW LEVEL SECURITY;
ALTER TABLE chitietphieutrahang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_chitietphieutrahang ON chitietphieutrahang;
CREATE POLICY p_chitietphieutrahang ON chitietphieutrahang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR EXISTS (
        SELECT 1 FROM phieutrahang
        WHERE phieutrahang.id = chitietphieutrahang.phieu_tra_hang_id
        AND phieutrahang.khach_hang_id = rls_current_user_id()
    )
);

-- Table: toathuoc
ALTER TABLE toathuoc ENABLE ROW LEVEL SECURITY;
ALTER TABLE toathuoc FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_toathuoc ON toathuoc;
CREATE POLICY p_toathuoc ON toathuoc
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR khach_hang_id = rls_current_user_id()
);

-- Table: sanphamyeuthich
ALTER TABLE sanphamyeuthich ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanphamyeuthich FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_sanphamyeuthich ON sanphamyeuthich;
CREATE POLICY p_sanphamyeuthich ON sanphamyeuthich
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR khach_hang_id = rls_current_user_id()
);

-- Table: danhgiasanpham
ALTER TABLE danhgiasanpham ENABLE ROW LEVEL SECURITY;
ALTER TABLE danhgiasanpham FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_danhgiasanpham_select ON danhgiasanpham;
CREATE POLICY p_danhgiasanpham_select ON danhgiasanpham
FOR SELECT USING (true);

DROP POLICY IF EXISTS p_danhgiasanpham_mod ON danhgiasanpham;
CREATE POLICY p_danhgiasanpham_mod ON danhgiasanpham
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR khach_hang_id = rls_current_user_id()
);

-- Table: khachhang
ALTER TABLE khachhang ENABLE ROW LEVEL SECURITY;
ALTER TABLE khachhang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_khachhang ON khachhang;
CREATE POLICY p_khachhang ON khachhang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
    OR id = rls_current_user_id()
);

-- =============================================================================
-- 3. Staff / Facility Unit Domain Tables (Isolation by don_vi_id)
-- =============================================================================

-- Table: tonkho
ALTER TABLE tonkho ENABLE ROW LEVEL SECURITY;
ALTER TABLE tonkho FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_tonkho ON tonkho;
CREATE POLICY p_tonkho ON tonkho
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'customer'
    OR don_vi_id = rls_current_unit_id()
);

-- Table: hopthuoc
ALTER TABLE hopthuoc ENABLE ROW LEVEL SECURITY;
ALTER TABLE hopthuoc FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_hopthuoc ON hopthuoc;
CREATE POLICY p_hopthuoc ON hopthuoc
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'customer'
    OR don_vi_hien_tai_id = rls_current_unit_id()
);

-- Table: kienhang
ALTER TABLE kienhang ENABLE ROW LEVEL SECURITY;
ALTER TABLE kienhang FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_kienhang ON kienhang;
CREATE POLICY p_kienhang ON kienhang
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'customer'
    OR don_vi_so_huu_id = rls_current_unit_id()
);

-- Table: lichsuphanphoi
ALTER TABLE lichsuphanphoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE lichsuphanphoi FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_lichsuphanphoi ON lichsuphanphoi;
CREATE POLICY p_lichsuphanphoi ON lichsuphanphoi
FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'customer'
    OR tu_don_vi_id = rls_current_unit_id()
    OR den_don_vi_id = rls_current_unit_id()
);

-- Table: nhanvien
ALTER TABLE nhanvien ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhanvien FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_nhanvien ON nhanvien;
CREATE POLICY p_nhanvien ON nhanvien
FOR ALL USING (
    rls_can_bypass()
    OR id = rls_current_user_id()
    OR don_vi_id = rls_current_unit_id()
);

-- =============================================================================
-- 4. Master Data & Catalog Tables (Public Read, Staff Write)
-- =============================================================================

-- Table: duocpham
ALTER TABLE duocpham ENABLE ROW LEVEL SECURITY;
ALTER TABLE duocpham FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_duocpham_select ON duocpham;
CREATE POLICY p_duocpham_select ON duocpham FOR SELECT USING (true);

DROP POLICY IF EXISTS p_duocpham_mod ON duocpham;
CREATE POLICY p_duocpham_mod ON duocpham FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: danhmuc
ALTER TABLE danhmuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE danhmuc FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_danhmuc_select ON danhmuc;
CREATE POLICY p_danhmuc_select ON danhmuc FOR SELECT USING (true);

DROP POLICY IF EXISTS p_danhmuc_mod ON danhmuc;
CREATE POLICY p_danhmuc_mod ON danhmuc FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: quycachdonggoi
ALTER TABLE quycachdonggoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE quycachdonggoi FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_quycachdonggoi_select ON quycachdonggoi;
CREATE POLICY p_quycachdonggoi_select ON quycachdonggoi FOR SELECT USING (true);

DROP POLICY IF EXISTS p_quycachdonggoi_mod ON quycachdonggoi;
CREATE POLICY p_quycachdonggoi_mod ON quycachdonggoi FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: baiviet
ALTER TABLE baiviet ENABLE ROW LEVEL SECURITY;
ALTER TABLE baiviet FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_baiviet_select ON baiviet;
CREATE POLICY p_baiviet_select ON baiviet FOR SELECT USING (true);

DROP POLICY IF EXISTS p_baiviet_mod ON baiviet;
CREATE POLICY p_baiviet_mod ON baiviet FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: khuyenmai
ALTER TABLE khuyenmai ENABLE ROW LEVEL SECURITY;
ALTER TABLE khuyenmai FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_khuyenmai_select ON khuyenmai;
CREATE POLICY p_khuyenmai_select ON khuyenmai FOR SELECT USING (true);

DROP POLICY IF EXISTS p_khuyenmai_mod ON khuyenmai;
CREATE POLICY p_khuyenmai_mod ON khuyenmai FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: donvi
ALTER TABLE donvi ENABLE ROW LEVEL SECURITY;
ALTER TABLE donvi FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_donvi_select ON donvi;
CREATE POLICY p_donvi_select ON donvi FOR SELECT USING (true);

DROP POLICY IF EXISTS p_donvi_mod ON donvi;
CREATE POLICY p_donvi_mod ON donvi FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: lothuoc
ALTER TABLE lothuoc ENABLE ROW LEVEL SECURITY;
ALTER TABLE lothuoc FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_lothuoc_select ON lothuoc;
CREATE POLICY p_lothuoc_select ON lothuoc FOR SELECT USING (true);

DROP POLICY IF EXISTS p_lothuoc_mod ON lothuoc;
CREATE POLICY p_lothuoc_mod ON lothuoc FOR ALL USING (
    rls_can_bypass()
    OR current_setting('app.current_user_type', true) = 'staff'
);

-- Table: nhatkyxacthuc
ALTER TABLE nhatkyxacthuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhatkyxacthuc FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_nhatkyxacthuc_select ON nhatkyxacthuc;
CREATE POLICY p_nhatkyxacthuc_select ON nhatkyxacthuc FOR SELECT USING (true);

DROP POLICY IF EXISTS p_nhatkyxacthuc_mod ON nhatkyxacthuc;
CREATE POLICY p_nhatkyxacthuc_mod ON nhatkyxacthuc FOR ALL USING (true);
