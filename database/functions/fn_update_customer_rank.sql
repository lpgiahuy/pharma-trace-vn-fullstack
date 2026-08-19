-- Function: fn_update_customer_rank
DROP FUNCTION IF EXISTS public.fn_update_customer_rank(INTEGER);
CREATE OR REPLACE FUNCTION public.fn_update_customer_rank(p_khach_hang_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_total_points INTEGER;
    v_new_tier VARCHAR(50);
BEGIN
    SELECT COALESCE(diem_tich_luy, 0) INTO v_total_points
    FROM public.khachhang
    WHERE id = p_khach_hang_id;

    IF v_total_points >= 5000 THEN
        v_new_tier := 'KIM_CUONG';
    ELSIF v_total_points >= 2000 THEN
        v_new_tier := 'VANG';
    ELSIF v_total_points >= 500 THEN
        v_new_tier := 'BAC';
    ELSE
        v_new_tier := 'DONG';
    END IF;

    UPDATE public.khachhang
    SET hang_thanh_vien = v_new_tier
    WHERE id = p_khach_hang_id;
END;
$$ LANGUAGE plpgsql;
