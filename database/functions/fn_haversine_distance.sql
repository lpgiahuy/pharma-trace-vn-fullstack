-- Function: fn_haversine_distance
DROP FUNCTION IF EXISTS public.fn_haversine_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC);
CREATE OR REPLACE FUNCTION public.fn_haversine_distance(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371; -- Earth radius in km
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dlat := radians((lat2 - lat1)::DOUBLE PRECISION);
    dlon := radians((lon2 - lon1)::DOUBLE PRECISION);
    a := sin(dlat / 2)^2 + cos(radians(lat1::DOUBLE PRECISION)) * cos(radians(lat2::DOUBLE PRECISION)) * sin(dlon / 2)^2;
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
