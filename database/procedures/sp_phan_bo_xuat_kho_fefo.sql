-- ========================================================
-- Stored Procedure: sp_phan_bo_xuat_kho_fefo
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_phan_bo_xuat_kho_fefo(IN p_duoc_pham_id integer, IN p_quy_cach_id integer, IN p_don_vi_id integer, IN p_can integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
   	cur_lo CURSOR FOR
		SELECT lt.id,lt.so_lo, lt.han_su_dung, COUNT(ht.uid) AS so_hop_co
		FROM LoThuoc lt
		JOIN HopThuoc ht ON ht.lo_thuoc_id = lt.id
		WHERE lt.duoc_pham_id = p_duoc_pham_id
		  AND lt.quy_cach_id = p_quy_cach_id
		  AND lt.trang_thai = 'HopLe'
		  AND ht.don_vi_hien_tai_id = p_don_vi_id
		  AND ht.trang_thai = 'TrongKho'
		GROUP BY lt.id, lt.so_lo, lt.han_su_dung
		ORDER BY lt.han_su_dung;
	
    v_lo_id INT; v_so_lo VARCHAR; v_hsd DATE;
    v_co INT; v_lay INT; v_con_lai INT;
BEGIN
    RAISE NOTICE 'FEFO: thuốc %, quy cách %, kho %, cần % hộp',
        p_duoc_pham_id, p_quy_cach_id, p_don_vi_id, p_can;
    v_con_lai := p_can;
    OPEN cur_lo;
    LOOP
        FETCH cur_lo INTO v_lo_id, v_so_lo, v_hsd, v_co;
        EXIT WHEN NOT FOUND;
        EXIT WHEN v_con_lai <= 0;
        v_lay := LEAST(v_co, v_con_lai);
        v_con_lai := v_con_lai - v_lay;
        RAISE NOTICE
            'Lô % (HSD %) - Có % hộp - Lấy % - Còn cần %', v_so_lo, v_hsd, v_co, v_lay, v_con_lai;
    END LOOP;
    CLOSE cur_lo;
    IF v_con_lai > 0 THEN
        RAISE NOTICE 'THIẾU HÀNG: còn thiếu % hộp', v_con_lai;
    ELSE
        RAISE NOTICE 'ĐÃ PHÂN BỔ ĐỦ % hộp', p_can;
    END IF;
END; $$;
