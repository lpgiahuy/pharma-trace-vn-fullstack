-- ========================================================
-- Stored Procedure: sp_hoan_thanh_don_hang
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_hoan_thanh_don_hang(IN p_don_hang_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_khach_hang_id INT;
    v_trang_thai_hien_tai VARCHAR(50);
BEGIN
    SELECT khach_hang_id, trang_thai_don
    INTO v_khach_hang_id, v_trang_thai_hien_tai
    FROM DonHang
    WHERE id = p_don_hang_id;

    IF v_trang_thai_hien_tai IS NULL THEN
        RAISE EXCEPTION 'Lỗi: Đơn hàng không tồn tại!';
    END IF;
    IF v_trang_thai_hien_tai != 'DangGiao' THEN
        RAISE EXCEPTION 'Lỗi: Chỉ có thể hoàn thành đơn hàng đang ở trạng thái DangGiao. Trạng thái hiện tại: %',
            v_trang_thai_hien_tai;
    END IF;

    UPDATE DonHang
    SET trang_thai_don = 'ChoHoanTat',
        trang_thai_thanh_toan = 'DaThanhToan'
    WHERE id = p_don_hang_id;

    UPDATE HopThuoc
    SET trang_thai = 'DaBan'
    WHERE don_hang_id = p_don_hang_id;

	INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, loai_giao_dich, ghi_chu)
    SELECT uid, 'GiaoHangThanhCong', 'Giao hàng thành công - Đơn hàng #' || p_don_hang_id
    FROM HopThuoc
    WHERE don_hang_id = p_don_hang_id;
	
    UPDATE DuocPham dp
    SET so_luong_da_ban   = dp.so_luong_da_ban + sub.tong_sl,
        ngay_cap_nhat_moi = CURRENT_TIMESTAMP
    FROM (
        SELECT duoc_pham_id, SUM(so_luong) AS tong_sl
        FROM ChiTietDonHang
        WHERE don_hang_id = p_don_hang_id
        GROUP BY duoc_pham_id
    ) sub
    WHERE dp.id = sub.duoc_pham_id;
END; $$;
