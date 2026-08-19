-- ========================================================
-- Stored Procedure: sp_phan_tich_abc_ton_kho
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_phan_tich_abc_ton_kho(IN p_don_vi_id integer DEFAULT NULL::integer, IN p_nguong_a numeric DEFAULT 80, IN p_nguong_b numeric DEFAULT 95)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cur_sp CURSOR FOR
        SELECT dp.ten_thuoc, SUM(tk.so_luong_ton * qc.gia_ban) AS gia_tri
        FROM TonKho tk
        JOIN DuocPham dp ON tk.duoc_pham_id = dp.id
        JOIN QuyCachDongGoi qc ON tk.quy_cach_id = qc.id
        WHERE (p_don_vi_id IS NULL OR tk.don_vi_id = p_don_vi_id)
        GROUP BY dp.id, dp.ten_thuoc
        HAVING SUM(tk.so_luong_ton * qc.gia_ban) > 0
        ORDER BY gia_tri DESC;
    v_ten VARCHAR;
    v_gia_tri DECIMAL;
    v_tong DECIMAL;
    v_luy_ke DECIMAL := 0;
    v_pct NUMERIC;
    v_hang CHAR(1);
    v_a INT := 0; v_b INT := 0; v_c INT := 0;
BEGIN
    RAISE NOTICE 'PHÂN TÍCH ABC TỒN KHO (kho: %) ==',
        COALESCE(p_don_vi_id::TEXT, 'tất cả');
    SELECT SUM(tk.so_luong_ton * qc.gia_ban)
    INTO v_tong
    FROM TonKho tk
    JOIN QuyCachDongGoi qc ON tk.quy_cach_id = qc.id
    WHERE (p_don_vi_id IS NULL OR tk.don_vi_id = p_don_vi_id);

    IF COALESCE(v_tong, 0) = 0 THEN
        RAISE NOTICE 'Không có tồn kho để phân tích.';
        RETURN;
    END IF;

    OPEN cur_sp;
    LOOP
        FETCH cur_sp INTO v_ten, v_gia_tri;
        EXIT WHEN NOT FOUND;
        v_luy_ke := v_luy_ke + v_gia_tri;
        v_pct := ROUND(v_luy_ke / v_tong * 100, 1);
        v_hang := CASE
            WHEN v_pct <= p_nguong_a THEN 'A'
            WHEN v_pct <= p_nguong_b THEN 'B'
            ELSE 'C'
        END;
        IF v_hang = 'A' THEN v_a := v_a + 1;
        ELSIF v_hang = 'B' THEN v_b := v_b + 1;
        ELSE v_c := v_c + 1;
        END IF;
        RAISE NOTICE '[%] % | Giá trị: % | Lũy kế: % %%',
            v_hang, v_ten, v_gia_tri, v_pct;
    END LOOP;
    CLOSE cur_sp;
    RAISE NOTICE 'Hạng A=% sp, B=% sp, C=% sp.', v_a, v_b, v_c;
END; $$;
