-- ========================================================
-- Function: fn_find_nearest_pharmacies
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_find_nearest_pharmacies(p_lat numeric, p_lng numeric, p_duoc_pham_id integer, p_quy_cach_id integer) RETURNS TABLE(id integer, ten_nha_thuoc character varying, dia_chi text, khoang_cach double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RAISE EXCEPTION 'Tọa độ không hợp lệ';
    END IF;

    IF p_quy_cach_id IS NULL THEN
        RAISE EXCEPTION 'Quy cách sản phẩm không được để trống';
    END IF;

    RETURN QUERY
    WITH candidates AS (
        SELECT
            dv.id,
            dv.ten_don_vi,
            dv.dia_chi,
            fn_tinh_khoang_cach_km(p_lat, p_lng, dv.toa_do_lat, dv.toa_do_lng) AS kc
        FROM DonVi dv
        JOIN TonKho tk ON dv.id = tk.don_vi_id
        WHERE dv.loai_don_vi    = 'NhaThuoc'
          AND dv.toa_do_lat     IS NOT NULL
          AND dv.toa_do_lng     IS NOT NULL
          AND tk.duoc_pham_id   = p_duoc_pham_id
          AND tk.quy_cach_id    = p_quy_cach_id
          AND tk.so_luong_ton   > 0
    )
    SELECT c.id, c.ten_don_vi, c.dia_chi, ROUND(c.kc::NUMERIC, 2)::FLOAT
    FROM candidates c
    WHERE c.kc <= 50
    ORDER BY c.kc ASC
    LIMIT 5;
END; $$;
