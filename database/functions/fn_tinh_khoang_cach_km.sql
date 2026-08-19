-- ========================================================
-- Function: fn_tinh_khoang_cach_km
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_tinh_khoang_cach_km(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE R FLOAT := 6371; dlat FLOAT; dlon FLOAT; a FLOAT; c FLOAT;
BEGIN dlat := radians(lat2 - lat1); dlon := radians(lon2 - lon1); a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2); c := 2 * atan2(sqrt(a), sqrt(1-a)); RETURN R * c; END; $$;
