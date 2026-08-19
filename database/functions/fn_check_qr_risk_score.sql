-- ========================================================
-- Function: fn_check_qr_risk_score
-- Description: Business calculation function
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_check_qr_risk_score(p_uid uuid, p_new_lat numeric DEFAULT NULL::numeric, p_new_lng numeric DEFAULT NULL::numeric, p_new_time timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_max_scans_1m INT := 0;
    r RECORD;
    v_prev_lat DECIMAL; v_prev_lng DECIMAL; v_prev_time TIMESTAMP;
    v_dist FLOAT; v_time_diff_hours FLOAT;
BEGIN
    SELECT COALESCE(MAX(scan_count), 0) INTO v_max_scans_1m
    FROM (
        SELECT COUNT(*) OVER (
            ORDER BY thoi_gian_quet
            RANGE BETWEEN INTERVAL '1 minute' PRECEDING AND CURRENT ROW
        ) AS scan_count
        FROM (
            SELECT thoi_gian_quet
            FROM NhatKyXacThuc
            WHERE hop_thuoc_uid = p_uid
				AND thoi_gian_quet > NOW() - INTERVAL '24 hours'
            UNION ALL
            SELECT p_new_time
            WHERE p_new_time IS NOT NULL
        ) all_scans
    ) sub;

    IF v_max_scans_1m >= 10 THEN
        RETURN 100;
    END IF;

    SELECT toa_do_lat, toa_do_lng, thoi_gian_quet
    INTO v_prev_lat, v_prev_lng, v_prev_time
    FROM NhatKyXacThuc
    WHERE hop_thuoc_uid = p_uid
      AND toa_do_lat IS NOT NULL
    ORDER BY thoi_gian_quet DESC
    LIMIT 1;

    IF v_prev_lat IS NOT NULL AND p_new_lat IS NOT NULL THEN
        v_dist            := fn_tinh_khoang_cach_km(v_prev_lat, v_prev_lng, p_new_lat, p_new_lng);
        v_time_diff_hours := EXTRACT(EPOCH FROM (p_new_time - v_prev_time)) / 3600;

        IF v_time_diff_hours > 0 AND (v_dist / v_time_diff_hours) > 1000 THEN
            RETURN 100;
        END IF;
    END IF;

    IF p_new_lat IS NULL THEN
        v_prev_lat  := NULL;
        v_prev_lng  := NULL;
        v_prev_time := NULL;
        FOR r IN (
            SELECT toa_do_lat, toa_do_lng, thoi_gian_quet
            FROM NhatKyXacThuc
            WHERE hop_thuoc_uid = p_uid AND toa_do_lat IS NOT NULL
            ORDER BY thoi_gian_quet ASC
        ) LOOP
            IF v_prev_lat IS NOT NULL THEN
                v_dist            := fn_tinh_khoang_cach_km(v_prev_lat, v_prev_lng, r.toa_do_lat, r.toa_do_lng);
                v_time_diff_hours := EXTRACT(EPOCH FROM (r.thoi_gian_quet - v_prev_time)) / 3600;

                IF v_time_diff_hours > 0 AND (v_dist / v_time_diff_hours) > 1000 THEN
                    RETURN 100;
                END IF;
            END IF;
            v_prev_lat  := r.toa_do_lat;
            v_prev_lng  := r.toa_do_lng;
            v_prev_time := r.thoi_gian_quet;
        END LOOP;
    END IF;
    RETURN 0;
END; $$;
