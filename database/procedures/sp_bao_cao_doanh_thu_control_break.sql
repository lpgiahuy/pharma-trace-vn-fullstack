-- ========================================================
-- Stored Procedure: sp_bao_cao_doanh_thu_control_break
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_bao_cao_doanh_thu_control_break(IN p_tu_ngay date DEFAULT NULL::date, IN p_den_ngay date DEFAULT NULL::date)
    LANGUAGE plpgsql
    AS $$
DECLARE
	cur_ct CURSOR FOR
	SELECT kh.id AS kh_id, kh.ho_ten, dh.id AS don_id, dh.tong_tien AS thanh_tien
	FROM DonHang dh
	JOIN KhachHang kh ON dh.khach_hang_id = kh.id
	WHERE dh.trang_thai_don = 'HoanThanh'
	  AND (p_tu_ngay IS NULL OR dh.ngay_dat_hang >= p_tu_ngay)
	  AND (p_den_ngay IS NULL OR dh.ngay_dat_hang < p_den_ngay + 1)
	ORDER BY kh.id, dh.id;
		
    v_kh_id INT; v_ho_ten VARCHAR; v_don_id INT; v_thanh_tien DECIMAL;
    v_kh_prev INT := NULL; v_ten_prev VARCHAR; v_subtotal DECIMAL := 0; v_grand DECIMAL := 0;
BEGIN
    RAISE NOTICE 'Doanh thu từ % đến %',
        COALESCE(p_tu_ngay::TEXT, 'đầu'),
        COALESCE(p_den_ngay::TEXT, 'nay');

    OPEN cur_ct;
    LOOP
        FETCH cur_ct INTO v_kh_id, v_ho_ten, v_don_id, v_thanh_tien;
        EXIT WHEN NOT FOUND;

        IF v_kh_prev IS NOT NULL AND v_kh_id <> v_kh_prev THEN
            RAISE NOTICE '-> Tổng KH % (%): %', v_kh_prev, v_ten_prev, v_subtotal;
        END IF;

        RAISE NOTICE ' Đơn % - KH % - Thành tiền %', v_don_id, v_kh_id, v_thanh_tien;

        v_subtotal := v_subtotal + v_thanh_tien;
        v_grand := v_grand + v_thanh_tien;
        v_kh_prev := v_kh_id;
        v_ten_prev := v_ho_ten;
    END LOOP;
    CLOSE cur_ct;

    IF v_kh_prev IS NOT NULL THEN
        RAISE NOTICE '-> Tổng KH % (%): %', v_kh_prev, v_ten_prev, v_subtotal;
    END IF;

    RAISE NOTICE 'Tổng doanh thu từ % đến %: %',
        COALESCE(p_tu_ngay::TEXT, 'đầu'),
        COALESCE(p_den_ngay::TEXT, 'nay'),
        v_grand;
END; $$;
