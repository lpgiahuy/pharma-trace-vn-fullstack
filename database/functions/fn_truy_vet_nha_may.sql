-- ========================================================
-- Function: fn_truy_vet_nha_may
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_truy_vet_nha_may(p_uid uuid) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE v_ten_nha_may VARCHAR; BEGIN SELECT dv.ten_don_vi INTO v_ten_nha_may FROM HopThuoc ht JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id JOIN DuocPham dp ON lt.duoc_pham_id = dp.id JOIN DonVi dv ON dp.don_vi_san_xuat_id = dv.id WHERE ht.uid = p_uid; RETURN COALESCE(v_ten_nha_may, 'Mã không hợp lệ!'); END; $$;
