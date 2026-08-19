-- ========================================================
-- Stored Procedure: sp_tu_choi_toa_thuoc_qua_han
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_tu_choi_toa_thuoc_qua_han(IN p_so_ngay integer DEFAULT 14)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cur_toa CURSOR FOR
        SELECT id, khach_hang_id, don_hang_id, ten_bac_si, ten_benh_vien, ngay_tao
        FROM ToaThuoc
        WHERE trang_thai_duyet = 'ChoDuyet'
          AND ngay_tao < CURRENT_TIMESTAMP - (p_so_ngay || ' days')::INTERVAL
        ORDER BY ngay_tao
        FOR UPDATE;

    v_id INT; v_kh_id INT; v_don_id INT;
    v_bac_si VARCHAR; v_benh_vien VARCHAR; v_ngay_tao TIMESTAMP;
    v_ngay_cho INT; v_so_tu_choi INT := 0; v_tong INT := 0;
BEGIN
    RAISE NOTICE 'Tự động từ chối toa thuốc chờ duyệt quá % ngày', p_so_ngay;
    OPEN cur_toa;
    LOOP
        FETCH cur_toa INTO v_id, v_kh_id, v_don_id, v_bac_si, v_benh_vien, v_ngay_tao;
        EXIT WHEN NOT FOUND;
        v_tong := v_tong + 1;
        v_ngay_cho := EXTRACT(DAY FROM CURRENT_TIMESTAMP - v_ngay_tao)::INT;
        UPDATE ToaThuoc SET trang_thai_duyet = 'TuChoi' WHERE CURRENT OF cur_toa;
        v_so_tu_choi := v_so_tu_choi + 1;
        UPDATE ToaThuoc SET trang_thai_duyet = 'TuChoi' WHERE CURRENT OF cur_toa;
        v_so_tu_choi := v_so_tu_choi + 1;
        RAISE NOTICE 'Toa #% - KH % - Đơn #% - BS: % (%) - Nộp: % - Đã chờ % ngày -> TỪ CHỐI',
            v_id, v_kh_id, v_don_id, v_bac_si, v_benh_vien, v_ngay_tao, v_ngay_cho;
    END LOOP;
    CLOSE cur_toa;
    RAISE NOTICE 'Đã từ chối %/% toa thuốc chờ duyệt quá % ngày.', v_so_tu_choi, v_tong, p_so_ngay;
END; $$;
