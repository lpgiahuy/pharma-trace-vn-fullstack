SET client_encoding = 'UTF8';

-- 1. Bảng Sổ Quỹ Thu / Chi (Cashbook Log)
CREATE TABLE IF NOT EXISTS public.so_quy_thu_chi (
    id SERIAL PRIMARY KEY,
    ma_phieu VARCHAR(50) UNIQUE NOT NULL,
    loai_phieu VARCHAR(20) NOT NULL CHECK (loai_phieu IN ('Thu', 'Chi')),
    loai_giao_dich VARCHAR(50) NOT NULL, -- 'ThuTienDonHang', 'ThuTienCongNoKhach', 'ChiTienNhapHangNCC', 'ChiTienHoanRMA', 'ChiTienVanHang', 'ThuChiKhac'
    so_tien NUMERIC(15,2) NOT NULL CHECK (so_tien > 0),
    doi_tuong_loai VARCHAR(30) DEFAULT 'Khac' CHECK (doi_tuong_loai IN ('KhachHang', 'NhaCungCap', 'NhanVien', 'Khac')),
    doi_tuong_ten VARCHAR(255),
    don_hang_id INTEGER REFERENCES public.donhang(id) ON DELETE SET NULL,
    don_nhap_id INTEGER REFERENCES public.phieunhap(id) ON DELETE SET NULL,
    phuong_thuc VARCHAR(50) DEFAULT 'ChuyenKhoan' CHECK (phuong_thuc IN ('TienMat', 'ChuyenKhoan', 'TheATM', 'ViDienTu')),
    ghi_chu TEXT,
    ngay_giao_dich TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- 2. Bảng Quản Lý Công Nợ Phải Thu Khách Hàng (Accounts Receivable - AR)
CREATE TABLE IF NOT EXISTS public.cong_no_khach_hang (
    id SERIAL PRIMARY KEY,
    khach_hang_id INTEGER NOT NULL REFERENCES public.khachhang(id) ON DELETE CASCADE,
    don_hang_id INTEGER REFERENCES public.donhang(id) ON DELETE SET NULL,
    tong_tien_no NUMERIC(15,2) NOT NULL CHECK (tong_tien_no >= 0),
    da_thanh_toan NUMERIC(15,2) DEFAULT 0 CHECK (da_thanh_toan >= 0),
    con_no NUMERIC(15,2) GENERATED ALWAYS AS (tong_tien_no - da_thanh_toan) STORED,
    han_thanh_toan TIMESTAMP WITH TIME ZONE,
    trang_thai VARCHAR(50) DEFAULT 'ChuaThanhToan' CHECK (trang_thai IN ('ChuaThanhToan', 'ThanhToanMotPhan', 'DaThanhToanQuaHan', 'DaThanhToan')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Quản Lý Công Nợ Phải Trả Nhà Cung Cấp (Accounts Payable - AP)
CREATE TABLE IF NOT EXISTS public.cong_no_nha_cung_cap (
    id SERIAL PRIMARY KEY,
    nha_cung_cap_ten VARCHAR(255) NOT NULL,
    don_nhap_id INTEGER REFERENCES public.phieunhap(id) ON DELETE SET NULL,
    tong_tien_no NUMERIC(15,2) NOT NULL CHECK (tong_tien_no >= 0),
    da_thanh_toan NUMERIC(15,2) DEFAULT 0 CHECK (da_thanh_toan >= 0),
    con_no NUMERIC(15,2) GENERATED ALWAYS AS (tong_tien_no - da_thanh_toan) STORED,
    han_thanh_toan TIMESTAMP WITH TIME ZONE,
    trang_thai VARCHAR(50) DEFAULT 'ChuaThanhToan' CHECK (trang_thai IN ('ChuaThanhToan', 'ThanhToanMotPhan', 'DaThanhToan')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable RLS
ALTER TABLE public.so_quy_thu_chi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cong_no_khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cong_no_nha_cung_cap ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS p_so_quy_thu_chi ON public.so_quy_thu_chi;
CREATE POLICY p_so_quy_thu_chi ON public.so_quy_thu_chi FOR ALL USING (
    rls_can_bypass() OR current_setting('app.current_user_type', true) = 'staff'
);

DROP POLICY IF EXISTS p_cong_no_khach_hang ON public.cong_no_khach_hang;
CREATE POLICY p_cong_no_khach_hang ON public.cong_no_khach_hang FOR ALL USING (
    rls_can_bypass() OR current_setting('app.current_user_type', true) = 'staff' OR khach_hang_id = rls_current_user_id()
);

DROP POLICY IF EXISTS p_cong_no_nha_cung_cap ON public.cong_no_nha_cung_cap;
CREATE POLICY p_cong_no_nha_cung_cap ON public.cong_no_nha_cung_cap FOR ALL USING (
    rls_can_bypass() OR current_setting('app.current_user_type', true) = 'staff'
);

-- 6. Insert Mock Data Seeds for Demonstration
INSERT INTO public.so_quy_thu_chi (ma_phieu, loai_phieu, loai_giao_dich, so_tien, doi_tuong_loai, doi_tuong_ten, don_hang_id, don_nhap_id, phuong_thuc, ghi_chu)
VALUES 
('PT-20260810-001', 'Thu', 'ThuTienDonHang', 12500000.00, 'KhachHang', 'Bệnh viện Đa khoa Quốc tế Vinmec', 9, NULL, 'ChuyenKhoan', 'Thanh toán đợt 1 tiền đơn hàng dược phẩm #9'),
('PT-20260811-002', 'Thu', 'ThuTienDonHang', 8400000.00, 'KhachHang', 'Nhà thuốc Long Châu Chi nhánh 1', 9, NULL, 'TienMat', 'Thu tiền mặt đơn hàng #9'),
('PC-20260811-001', 'Chi', 'ChiTienNhapHangNCC', 15000000.00, 'NhaCungCap', 'Công ty Cổ phần Dược Hậu Giang (DHG Pharma)', NULL, 1, 'ChuyenKhoan', 'Thanh toán đợt 1 đơn nhập hàng PO-102'),
('PC-20260812-002', 'Chi', 'ChiTienHoanRMA', 10800.00, 'KhachHang', 'Lê Phạm Gia Huy', 9, NULL, 'ChuyenKhoan', 'Hoàn tiền phiếu trả hàng RMA đơn hàng #9')
ON CONFLICT (ma_phieu) DO NOTHING;

INSERT INTO public.cong_no_khach_hang (khach_hang_id, don_hang_id, tong_tien_no, da_thanh_toan, han_thanh_toan, trang_thai)
VALUES
(1, 9, 25000000.00, 12500000.00, CURRENT_TIMESTAMP + INTERVAL '15 days', 'ThanhToanMotPhan'),
(2, 9, 8400000.00, 8400000.00, CURRENT_TIMESTAMP + INTERVAL '30 days', 'DaThanhToan')
ON CONFLICT DO NOTHING;

INSERT INTO public.cong_no_nha_cung_cap (nha_cung_cap_ten, don_nhap_id, tong_tien_no, da_thanh_toan, han_thanh_toan, trang_thai)
VALUES
('Công ty Cổ phần Dược Hậu Giang (DHG Pharma)', 1, 45000000.00, 15000000.00, CURRENT_TIMESTAMP + INTERVAL '20 days', 'ThanhToanMotPhan'),
('Tập đoàn Dược phẩm Traphaco', 1, 28000000.00, 0, CURRENT_TIMESTAMP + INTERVAL '10 days', 'ChuaThanhToan')
ON CONFLICT DO NOTHING;
