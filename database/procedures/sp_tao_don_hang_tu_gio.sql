-- ========================================================
-- Stored Procedure: sp_tao_don_hang_tu_gio
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_tao_don_hang_tu_gio(IN p_khach_hang_id integer, IN p_don_vi_xuat_id integer, IN p_dia_chi_giao text, IN p_phuong_thuc_tt character varying, IN p_ma_giam_gia character varying DEFAULT NULL::character varying, IN p_diem_su_dung integer DEFAULT 0, IN p_phi_ship numeric DEFAULT 30000, IN p_toa_thuoc_id integer DEFAULT NULL::integer, INOUT p_don_hang_id integer DEFAULT NULL::integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tong_tien_hang DECIMAL := 0; v_tien_giam_tu_diem DECIMAL := 0; v_tien_giam_tu_voucher DECIMAL := 0; v_tong_tien_thanh_toan DECIMAL := 0;
    v_diem_hien_co INT; v_voucher RECORD; v_co_thuoc_ke_don BOOLEAN := FALSE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE id = p_khach_hang_id) THEN
        RAISE EXCEPTION 'Khách hàng không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM DonVi WHERE id = p_don_vi_xuat_id) THEN
        RAISE EXCEPTION 'Kho xuất không tồn tại';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ChiTietGioHang WHERE khach_hang_id = p_khach_hang_id) THEN
        RAISE EXCEPTION 'Giỏ hàng trống';
    END IF;

	IF EXISTS (
        SELECT 1
        FROM ChiTietGioHang ctg
        JOIN DuocPham dp ON ctg.duoc_pham_id = dp.id
        WHERE ctg.khach_hang_id = p_khach_hang_id
          AND (dp.trang_thai = FALSE OR dp.trang_thai_duyet != 'DaDuyet')
    ) THEN
        RAISE EXCEPTION 'Giỏ hàng chứa sản phẩm đã bị ngừng kinh doanh hoặc chưa được duyệt. Vui lòng kiểm tra và cập nhật giỏ hàng.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM ChiTietGioHang ctg
        JOIN DuocPham dp ON ctg.duoc_pham_id = dp.id
        WHERE ctg.khach_hang_id = p_khach_hang_id
          AND dp.la_thuoc_ke_don = TRUE
    ) INTO v_co_thuoc_ke_don;

    IF v_co_thuoc_ke_don THEN
        IF p_toa_thuoc_id IS NULL THEN
            RAISE EXCEPTION 'Giỏ hàng có thuốc kê đơn. Vui lòng cung cấp mã toa thuốc.';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM ToaThuoc
            WHERE id             = p_toa_thuoc_id
              AND khach_hang_id  = p_khach_hang_id
              AND trang_thai_duyet = 'HopLe'
              AND don_hang_id    IS NULL
        ) THEN
            RAISE EXCEPTION 'Toa thuốc không hợp lệ hoặc đã được sử dụng.';
        END IF;
    END IF;

    IF p_diem_su_dung > 0 THEN
        SELECT diem_tich_luy INTO v_diem_hien_co
        FROM KhachHang WHERE id = p_khach_hang_id;

        IF v_diem_hien_co < p_diem_su_dung THEN
            RAISE EXCEPTION 'Điểm tích lũy không đủ. Hiện có: %, Sử dụng: %',
                v_diem_hien_co, p_diem_su_dung;
        END IF;
        v_tien_giam_tu_diem := p_diem_su_dung * 100;
    END IF;

    SELECT COALESCE(SUM(qc.gia_ban * ctg.so_luong), 0)
	INTO v_tong_tien_hang
	FROM (
	    SELECT quy_cach_id, so_luong
	    FROM ChiTietGioHang
	    WHERE khach_hang_id = p_khach_hang_id
	    FOR UPDATE
	) ctg
	JOIN QuyCachDongGoi qc ON ctg.quy_cach_id = qc.id;

    IF p_ma_giam_gia IS NOT NULL AND TRIM(p_ma_giam_gia) != '' THEN
        SELECT * INTO v_voucher
        FROM KhuyenMai
        WHERE ma_code = TRIM(p_ma_giam_gia)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Mã giảm giá không tồn tại';
        END IF;
        IF NOT (CURRENT_TIMESTAMP BETWEEN v_voucher.ngay_bat_dau AND v_voucher.ngay_ket_thuc) THEN
            RAISE EXCEPTION 'Mã giảm giá đã hết hạn';
        END IF;
        IF v_voucher.so_luong_gioi_han IS NOT NULL
           AND v_voucher.so_luong_da_dung >= v_voucher.so_luong_gioi_han THEN
            RAISE EXCEPTION 'Mã giảm giá đã hết lượt sử dụng';
        END IF;
        IF (v_tong_tien_hang + p_phi_ship) < v_voucher.don_hang_toi_thieu THEN
            RAISE EXCEPTION 'Đơn hàng phải từ % để áp dụng mã này', v_voucher.don_hang_toi_thieu;
        END IF;

        IF v_voucher.loai_giam_gia = 'PhanTram' THEN
            v_tien_giam_tu_voucher := ROUND((v_tong_tien_hang + p_phi_ship) * (v_voucher.gia_tri / 100), 0);
        ELSIF v_voucher.loai_giam_gia = 'TienMat' THEN
            v_tien_giam_tu_voucher := v_voucher.gia_tri;
        ELSIF v_voucher.loai_giam_gia = 'FreeShip' THEN
            v_tien_giam_tu_voucher := p_phi_ship;
        END IF;
    END IF;

    v_tong_tien_thanh_toan := GREATEST(
        v_tong_tien_hang + p_phi_ship - v_tien_giam_tu_voucher - v_tien_giam_tu_diem,
        0
    );

    INSERT INTO DonHang (khach_hang_id, tong_tien, phi_van_chuyen, dia_chi_giao_hang,
                         phuong_thuc_thanh_toan, ma_giam_gia, diem_su_dung,
                         tien_giam_tu_diem, tien_giam_tu_voucher)
    VALUES (p_khach_hang_id, v_tong_tien_thanh_toan, p_phi_ship, p_dia_chi_giao,
            p_phuong_thuc_tt, NULLIF(TRIM(p_ma_giam_gia), ''), p_diem_su_dung,
            v_tien_giam_tu_diem, v_tien_giam_tu_voucher)
    RETURNING id INTO p_don_hang_id;

    INSERT INTO ChiTietDonHang (don_hang_id, duoc_pham_id, quy_cach_id, so_luong,
                                don_gia, don_vi_xuat_id, gia_goc_luc_mua, phan_tram_giam_luc_mua)
    SELECT p_don_hang_id, ctg.duoc_pham_id, ctg.quy_cach_id, ctg.so_luong,
           qc.gia_ban, p_don_vi_xuat_id, qc.gia_goc, qc.phan_tram_giam
    FROM ChiTietGioHang ctg
    JOIN QuyCachDongGoi qc ON ctg.quy_cach_id = qc.id
    WHERE ctg.khach_hang_id = p_khach_hang_id;

    DELETE FROM ChiTietGioHang WHERE khach_hang_id = p_khach_hang_id;

    IF v_co_thuoc_ke_don AND p_toa_thuoc_id IS NOT NULL THEN
        UPDATE ToaThuoc SET don_hang_id = p_don_hang_id WHERE id = p_toa_thuoc_id;
    END IF;

    IF p_diem_su_dung > 0 THEN
        UPDATE KhachHang
        SET diem_tich_luy = diem_tich_luy - p_diem_su_dung
        WHERE id = p_khach_hang_id;
    END IF;

    IF p_ma_giam_gia IS NOT NULL AND TRIM(p_ma_giam_gia) != '' THEN
        UPDATE KhuyenMai
        SET so_luong_da_dung = so_luong_da_dung + 1
        WHERE ma_code = TRIM(p_ma_giam_gia);
    END IF;

END; $$;
