-- ========================================================
-- Stored Procedure: sp_kiem_ke_ton_kho
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_kiem_ke_ton_kho(IN p_don_vi_id integer DEFAULT NULL::integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cur_tk CURSOR (p_dv INT) FOR
        SELECT tk.don_vi_id, dv.ten_don_vi,
               tk.duoc_pham_id, dp.ten_thuoc,
               tk.quy_cach_id, qc.ten_don_vi AS quy_cach,
               tk.so_luong_ton
        FROM TonKho tk
        JOIN DonVi dv ON tk.don_vi_id = dv.id
        JOIN DuocPham dp ON tk.duoc_pham_id = dp.id
        JOIN QuyCachDongGoi qc ON tk.quy_cach_id = qc.id
        WHERE (p_dv IS NULL OR tk.don_vi_id = p_dv)
        ORDER BY tk.don_vi_id, dp.ten_thuoc;

    v_dv_id INT; v_ten_dv VARCHAR; v_dp_id INT; v_ten_thuoc VARCHAR;
    v_qc_id INT; v_quy_cach VARCHAR; v_ly_thuyet INT;
    v_thuc_te INT; v_lech INT;
    v_tong INT := 0; v_khop INT := 0; v_lech_cnt INT := 0;
BEGIN
    RAISE NOTICE 'KIỂM KÊ TỒN KHO%',
        CASE WHEN p_don_vi_id IS NOT NULL THEN ' (đơn vị #' || p_don_vi_id || ')' ELSE ' (toàn hệ thống)' END;
    OPEN cur_tk(p_don_vi_id);
    LOOP
        FETCH cur_tk INTO v_dv_id, v_ten_dv, v_dp_id, v_ten_thuoc, v_qc_id, v_quy_cach, v_ly_thuyet;
        EXIT WHEN NOT FOUND;
        v_tong := v_tong + 1;

        -- Đếm thực tế: số hộp UID đang 'TrongKho' tại đơn vị này, đúng thuốc + quy cách
        SELECT COUNT(ht.uid)
        INTO v_thuc_te
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.don_vi_hien_tai_id = v_dv_id
          AND lt.duoc_pham_id = v_dp_id
          AND lt.quy_cach_id = v_qc_id
          AND ht.trang_thai = 'TrongKho';

        v_lech := v_thuc_te - v_ly_thuyet;
        IF v_lech = 0 THEN
            v_khop := v_khop + 1;
            RAISE NOTICE 'Khớp: % | % (%): lý thuyết = thực tế = %',
                v_ten_dv, v_ten_thuoc, v_quy_cach, v_ly_thuyet;
        ELSE
            v_lech_cnt := v_lech_cnt + 1;
            RAISE NOTICE 'Lệch: % | % (%): lý thuyết %, thực tế %, lệch %',
                v_ten_dv, v_ten_thuoc, v_quy_cach, v_ly_thuyet, v_thuc_te, v_lech;
        END IF;
    END LOOP;
    CLOSE cur_tk;
    RAISE NOTICE 'Tổng: % dòng | Khớp: % | Lệch: %', v_tong, v_khop, v_lech_cnt;
END; $$;
