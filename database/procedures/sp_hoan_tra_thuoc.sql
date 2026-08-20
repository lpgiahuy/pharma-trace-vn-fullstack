-- ========================================================
-- Stored Procedure: sp_hoan_tra_thuoc
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_hoan_tra_thuoc(IN p_don_hang_id integer, IN p_don_vi_nhan_id integer, IN p_mang_uid uuid[], IN p_ly_do text DEFAULT 'Khách hàng yêu cầu hoàn trả'::text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    r             RECORD;
    v_count       INT;
    v_input_count INT;
    v_khach_hang_id INT;
    v_trang_thai  VARCHAR(50);
    v_phieu_id    INT;
    v_con_lai     INT;
BEGIN
    v_input_count := COALESCE(array_length(p_mang_uid, 1), 0);
    IF v_input_count = 0 THEN
        RAISE EXCEPTION 'Danh sách mã UID trống!';
    END IF;

    SELECT khach_hang_id, trang_thai_don
    INTO v_khach_hang_id, v_trang_thai
    FROM DonHang WHERE id = p_don_hang_id;

    IF v_khach_hang_id IS NULL THEN
        RAISE EXCEPTION 'Đơn hàng % không tồn tại!', p_don_hang_id;
    END IF;

    -- Cho phép trả tiếp nếu đã trả một phần
    IF v_trang_thai NOT IN ('ChoHoanTat', 'TraHangMotPhan') THEN
        RAISE EXCEPTION 'Chỉ được hoàn trả đơn hàng trong thời gian 7 ngày chờ hoàn tất. Trạng thái hiện tại: %',
            v_trang_thai;
    END IF;

    UPDATE HopThuoc
    SET don_hang_id        = NULL,
        don_vi_hien_tai_id = p_don_vi_nhan_id,
        trang_thai         = 'TrongKho'
    WHERE uid         = ANY(p_mang_uid)
      AND don_hang_id = p_don_hang_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> v_input_count THEN
        RAISE EXCEPTION 'Có %/% mã UID không thuộc đơn hàng %!',
            v_input_count - v_count, v_input_count, p_don_hang_id;
    END IF;

    -- Đếm hộp còn lại sau khi trả
    SELECT COUNT(*) INTO v_con_lai
    FROM HopThuoc WHERE don_hang_id = p_don_hang_id;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, den_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT unnest(p_mang_uid), p_don_vi_nhan_id, 'TraHang',
           'Hoàn trả từ đơn hàng #' || p_don_hang_id;

    FOR r IN (
        SELECT lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.uid = ANY(p_mang_uid)
        GROUP BY lt.duoc_pham_id, lt.quy_cach_id
    ) LOOP
        INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
        VALUES (p_don_vi_nhan_id, r.duoc_pham_id, r.quy_cach_id, r.sl)
        ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id)
        DO UPDATE SET
            so_luong_ton  = TonKho.so_luong_ton + r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
    END LOOP;

    UPDATE DuocPham dp
    SET so_luong_da_ban   = GREATEST(dp.so_luong_da_ban - sub.tong_sl, 0),
        ngay_cap_nhat_moi = CURRENT_TIMESTAMP
    FROM (
        SELECT lt.duoc_pham_id, COUNT(*) AS tong_sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.uid = ANY(p_mang_uid)
        GROUP BY lt.duoc_pham_id
    ) sub
    WHERE dp.id = sub.duoc_pham_id;

    -- Tạo phiếu trả hàng và ghi chi tiết mặt hàng được trả
    INSERT INTO PhieuTraHang (don_hang_id, khach_hang_id, ly_do_tra)
    VALUES (p_don_hang_id, v_khach_hang_id, COALESCE(p_ly_do, 'Khách hàng yêu cầu hoàn trả'))
    RETURNING id INTO v_phieu_id;

    INSERT INTO ChiTietPhieuTraHang (phieu_tra_hang_id, duoc_pham_id, quy_cach_id, so_luong)
    SELECT v_phieu_id, lt.duoc_pham_id, lt.quy_cach_id, COUNT(*)
    FROM HopThuoc ht
    JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
    WHERE ht.uid = ANY(p_mang_uid)
    GROUP BY lt.duoc_pham_id, lt.quy_cach_id;

    IF v_con_lai = 0 THEN
        UPDATE DonHang SET trang_thai_don = 'TraHang' WHERE id = p_don_hang_id;
    ELSE
        UPDATE DonHang SET trang_thai_don = 'TraHangMotPhan' WHERE id = p_don_hang_id;
    END IF;
END; $$;
