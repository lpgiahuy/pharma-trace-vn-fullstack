-- ========================================================
-- Function: fn_calculate_shipping_fee
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_calculate_shipping_fee(p_distance_km double precision) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN CASE 
        WHEN p_distance_km < 2 THEN 0           -- Dưới 2km: Miễn phí (Ưu đãi nội khu)
        WHEN p_distance_km < 5 THEN 15000       -- 2km - 5km: 15.000đ (Giao nhanh nội thành)
        WHEN p_distance_km < 10 THEN 30000      -- 5km - 10km: 30.000đ (Nội thành xa)
        WHEN p_distance_km < 30 THEN 40000      -- 10km - 30km: 40.000đ (Ngoại thành/Lân cận)
        ELSE 50000                              -- Trên 30km: 50.000đ (Giao hàng liên tỉnh toàn quốc)
    END;
END; $$;
