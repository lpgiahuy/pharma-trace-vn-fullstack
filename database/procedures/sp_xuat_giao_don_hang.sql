-- ========================================================
-- Stored Procedure: sp_xuat_giao_don_hang
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_xuat_giao_don_hang(IN p_don_hang_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_trang_thai VARCHAR;
BEGIN
    SELECT trang_thai_don INTO v_trang_thai
    FROM DonHang WHERE id = p_don_hang_id;

    IF v_trang_thai IS NULL THEN
        RAISE EXCEPTION 'Đơn hàng không tồn tại!';
    END IF;

    IF v_trang_thai != 'DaDongGoi' THEN
        RAISE EXCEPTION 'Chỉ xuất giao khi đơn đã đóng gói xong. Hiện tại: %', v_trang_thai;
    END IF;

    UPDATE DonHang SET trang_thai_don = 'DangGiao' WHERE id = p_don_hang_id;

    UPDATE HopThuoc
    SET trang_thai = 'DangGiao'
    WHERE don_hang_id = p_don_hang_id AND trang_thai = 'DaDongGoi';

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu)
	SELECT uid, don_vi_hien_tai_id, 'GiaoChoKhach', 'Bàn giao cho đơn vị vận chuyển'
	FROM HopThuoc
	WHERE don_hang_id = p_don_hang_id AND trang_thai = 'DangGiao';

END; $$;
