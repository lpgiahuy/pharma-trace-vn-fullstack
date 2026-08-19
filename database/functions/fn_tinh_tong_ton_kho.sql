-- ========================================================
-- Function: fn_tinh_tong_ton_kho
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_tinh_tong_ton_kho(p_duoc_pham_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE v_tong_ton INT; BEGIN SELECT COALESCE(SUM(so_luong_ton), 0) INTO v_tong_ton FROM TonKho WHERE duoc_pham_id = p_duoc_pham_id; RETURN v_tong_ton; END; $$;
