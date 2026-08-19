-- ========================================================
-- Function: fn_get_loyalty_upgrade_progress
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_get_loyalty_upgrade_progress(p_khach_hang_id integer) RETURNS TABLE(hang_hien_tai character varying, hang_tiep_theo character varying, diem_con_thieu integer)
    LANGUAGE plpgsql
    AS $$
DECLARE 
    v_diem INT; 
    v_hang VARCHAR;
BEGIN
    -- 1. Truy vấn dữ liệu gốc của khách hàng
    SELECT diem_tich_luy, hang_thanh_vien INTO v_diem, v_hang 
    FROM KhachHang
    WHERE id = p_khach_hang_id;

    -- 2. Trả về bảng dữ liệu đã qua xử lý logic thăng hạng
    RETURN QUERY 
    SELECT 
        v_hang,
        -- Nếu đã là Kim Cương thì hạng tiếp theo vẫn là Kim Cương (Cấp bậc tối đa)
        CASE 
            WHEN v_hang = 'Đồng' THEN 'Bạc'::VARCHAR
            WHEN v_hang = 'Bạc' THEN 'Vàng'::VARCHAR
            WHEN v_hang = 'Vàng' THEN 'Bạch Kim'::VARCHAR
            WHEN v_hang = 'Bạch Kim' THEN 'Kim Cương'::VARCHAR
            ELSE 'Kim Cương'::VARCHAR 
        END,
        -- Tính toán số điểm cần thiết để đạt hạng tiếp theo
        CASE 
            WHEN v_hang = 'Đồng' THEN GREATEST(500 - v_diem, 0)
            WHEN v_hang = 'Bạc' THEN GREATEST(2000 - v_diem, 0)
            WHEN v_hang = 'Vàng' THEN GREATEST(5000 - v_diem, 0)
            WHEN v_hang = 'Bạch Kim' THEN GREATEST(10000 - v_diem, 0)
            ELSE 0 -- Đã đạt Kim Cương thì không còn điểm thiếu
        END;
END; 
$$;
