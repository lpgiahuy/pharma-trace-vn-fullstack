-- ========================================================
-- Function: fn_tinh_tien_thanh_toan
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_tinh_tien_thanh_toan(p_khach_hang_id integer, p_ma_voucher character varying, p_diem_su_dung integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE v_tong DECIMAL := 0; v_giam DECIMAL := 0; v_loai VARCHAR; v_phai_tra DECIMAL;
BEGIN SELECT COALESCE(SUM(ctg.so_luong * qc.gia_ban), 0) INTO v_tong FROM ChiTietGioHang ctg JOIN QuyCachDongGoi qc ON ctg.quy_cach_id = qc.id WHERE ctg.khach_hang_id = p_khach_hang_id; IF p_ma_voucher IS NOT NULL AND p_ma_voucher != '' THEN SELECT loai_giam_gia, gia_tri INTO v_loai, v_giam FROM KhuyenMai WHERE ma_code = p_ma_voucher AND CURRENT_TIMESTAMP BETWEEN ngay_bat_dau AND ngay_ket_thuc AND so_luong_da_dung < so_luong_gioi_han; IF FOUND AND v_loai = 'PhanTram' THEN v_giam := v_tong * (v_giam / 100); END IF; END IF; v_phai_tra := v_tong - v_giam - (p_diem_su_dung * 100); RETURN GREATEST(v_phai_tra, 0); END; $$;
