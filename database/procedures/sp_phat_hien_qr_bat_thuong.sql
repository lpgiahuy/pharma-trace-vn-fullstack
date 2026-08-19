-- ========================================================
-- Stored Procedure: sp_phat_hien_qr_bat_thuong
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_phat_hien_qr_bat_thuong(IN p_nguong_kmh double precision DEFAULT 1000, IN p_so_ngay integer DEFAULT NULL::integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cur_quet CURSOR FOR
        SELECT hop_thuoc_uid, thoi_gian_quet, toa_do_lat, toa_do_lng
        FROM NhatKyXacThuc
        WHERE toa_do_lat IS NOT NULL AND toa_do_lng IS NOT NULL
          AND (p_so_ngay IS NULL
               OR thoi_gian_quet > CURRENT_TIMESTAMP - (p_so_ngay || ' days')::INTERVAL)
        ORDER BY hop_thuoc_uid, thoi_gian_quet;
    v_uid UUID;
    v_time TIMESTAMP;
    v_lat DECIMAL;
    v_lng DECIMAL;
    v_uid_prev UUID := NULL;
    v_time_prev TIMESTAMP;
    v_lat_prev DECIMAL;
    v_lng_prev DECIMAL;
    v_dist FLOAT;
    v_hours FLOAT;
    v_speed FLOAT;
    v_nghi_van INT := 0;
BEGIN
    RAISE NOTICE '== PHÁT HIỆN QR BẤT THƯỜNG (ngưỡng % km/h) ==', p_nguong_kmh;
    OPEN cur_quet;
    LOOP
        FETCH cur_quet INTO v_uid, v_time, v_lat, v_lng;
        EXIT WHEN NOT FOUND;
        IF v_uid = v_uid_prev THEN
            v_dist := fn_tinh_khoang_cach_km(v_lat_prev, v_lng_prev, v_lat, v_lng);
            v_hours := EXTRACT(EPOCH FROM (v_time - v_time_prev)) / 3600.0;
            IF v_hours > 0 THEN
                v_speed := v_dist / v_hours;
                IF v_speed > p_nguong_kmh THEN
                    v_nghi_van := v_nghi_van + 1;
                    RAISE NOTICE 'Hộp %: % km trong % giờ = % km/h → NGHI VẤN',
                        v_uid,
                        ROUND(v_dist::NUMERIC, 1),
                        ROUND(v_hours::NUMERIC, 2),
                        ROUND(v_speed::NUMERIC, 0);
                END IF;
            END IF;
        END IF;
        v_uid_prev := v_uid;
        v_time_prev := v_time;
        v_lat_prev := v_lat;
        v_lng_prev := v_lng;
    END LOOP;
    CLOSE cur_quet;
    RAISE NOTICE 'Phát hiện % lần di chuyển bất thường.', v_nghi_van;
END; $$;
