-- ========================================================
-- Stored Procedure: sp_thu_hoi_hang_loat
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_thu_hoi_hang_loat(IN p_nha_san_xuat_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cur_lo CURSOR FOR
        SELECT lt.id, lt.so_lo, dp.ten_thuoc
        FROM LoThuoc lt
        JOIN DuocPham dp ON lt.duoc_pham_id = dp.id
        WHERE dp.don_vi_san_xuat_id = p_nha_san_xuat_id
          AND lt.trang_thai = 'HopLe'
        ORDER BY lt.id;
    v_lo_id INT;
    v_so_lo VARCHAR;
    v_ten VARCHAR;
    v_ok INT := 0;
    v_fail INT := 0;
BEGIN
    RAISE NOTICE 'Thu hồi hàng loạt (NSX #%)', p_nha_san_xuat_id;
    OPEN cur_lo;
    LOOP
        FETCH cur_lo INTO v_lo_id, v_so_lo, v_ten;
        EXIT WHEN NOT FOUND;
        BEGIN
            CALL sp_thu_hoi_lo_thuoc(v_lo_id);
            v_ok := v_ok + 1;
            RAISE NOTICE 'Đã thu hồi lô % (%)', v_so_lo, v_ten;
        EXCEPTION WHEN OTHERS THEN
            v_fail := v_fail + 1;
            RAISE NOTICE 'Lỗi thu hồi lô % (%): %', v_so_lo, v_ten, SQLERRM;
        END;
    END LOOP;
    CLOSE cur_lo;
    RAISE NOTICE 'Thành công % lô, lỗi % lô.', v_ok, v_fail;
END; $$;
