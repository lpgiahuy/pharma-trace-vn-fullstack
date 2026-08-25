-- ==========================================================
-- Module 5: CRM, Tích Điểm Thành Viên & Đổi Trả Hàng (RMA)
-- Sub-system: PharmaTrace VN
-- ==========================================================

SET client_encoding = 'UTF8';

-- 1. Cập nhật Ràng buộc Check Hạng Thành Viên của Bảng khachhang
UPDATE public.khachhang SET hang_thanh_vien = 'Đồng' WHERE hang_thanh_vien IS NULL OR hang_thanh_vien NOT IN ('Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương');
ALTER TABLE public.khachhang DROP CONSTRAINT IF EXISTS khachhang_hang_thanh_vien_check;
ALTER TABLE public.khachhang ADD CONSTRAINT khachhang_hang_thanh_vien_check 
    CHECK (hang_thanh_vien IN ('Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương'));

-- 2. Cập nhật trigger validation phiếu trả hàng để chấp nhận trạng thái 'HoanThanh'
CREATE OR REPLACE FUNCTION public.trg_validate_phieu_tra_hang() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_trang_thai VARCHAR(50);
BEGIN
    SELECT trang_thai_don INTO v_trang_thai
    FROM DonHang WHERE id = NEW.don_hang_id;

    IF v_trang_thai IS NULL THEN
        RAISE EXCEPTION 'Đơn hàng ID % không tồn tại!', NEW.don_hang_id;
    END IF;

    IF v_trang_thai NOT IN ('ChoHoanTat', 'HoanThanh', 'TraHangMotPhan') THEN
        RAISE EXCEPTION 
            'Chỉ được tạo phiếu trả cho đơn đã hoàn thành hoặc trả một phần. Trạng thái hiện tại: %',
            v_trang_thai;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Bảng Lịch Sử Biến Động Điểm Thưởng Khách Hàng (Point History Log)
CREATE TABLE IF NOT EXISTS public.lichsu_tichdiem (
    id SERIAL PRIMARY KEY,
    khach_hang_id INTEGER NOT NULL REFERENCES public.khachhang(id) ON DELETE CASCADE,
    don_hang_id INTEGER REFERENCES public.donhang(id) ON DELETE SET NULL,
    loai_giao_dich VARCHAR(50) NOT NULL CHECK (loai_giao_dich IN ('TichDiem', 'DungDiem', 'ThuongRank', 'TruDiemRma', 'DieuChinhAdmin')),
    so_diem INTEGER NOT NULL,
    mo_ta TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index tối ưu truy vấn điểm thưởng
CREATE INDEX IF NOT EXISTS idx_tichdiem_khachhang ON public.lichsu_tichdiem(khach_hang_id);
CREATE INDEX IF NOT EXISTS idx_tichdiem_donhang ON public.lichsu_tichdiem(don_hang_id);
-- 4. Kích hoạt RLS Security cho bảng lichsu_tichdiem
ALTER TABLE public.lichsu_tichdiem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lichsu_tichdiem FORCE ROW LEVEL SECURITY;


-- 5. Dữ liệu thử nghiệm điểm thưởng & RMA
-- Initial data loaded via seeds

-- Thêm các yêu cầu Đổi trả hàng RMA thử nghiệm vào bảng phieutrahang (nếu chưa có)
-- Initial data loaded via seeds
