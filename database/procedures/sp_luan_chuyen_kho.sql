-- ========================================================
-- Stored Procedure: sp_luan_chuyen_kho
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_luan_chuyen_kho(IN p_tu_don_vi_id integer, IN p_den_don_vi_id integer, IN p_mang_uid uuid[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    r RECORD; v_count INT; v_input_count INT;
BEGIN
    v_input_count := COALESCE(array_length(p_mang_uid, 1), 0);
    IF v_input_count = 0 THEN
        RAISE EXCEPTION 'Danh sách mã UID trống!';
    END IF;

    UPDATE HopThuoc
    SET don_vi_hien_tai_id = p_den_don_vi_id,
        trang_thai = 'TrongKho'
    WHERE uid = ANY(p_mang_uid)
      AND don_vi_hien_tai_id = p_tu_don_vi_id
      AND trang_thai IN ('XuatXuong', 'TrongKho');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> v_input_count THEN
        RAISE EXCEPTION 'Lỗi: Có %/% mã không hợp lệ (sai vị trí hoặc trạng thái)!',
            (v_input_count - v_count), v_input_count;
    END IF;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, den_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT unnest(p_mang_uid), p_tu_don_vi_id, p_den_don_vi_id, 'XuatKho', 'Xuất kho luân chuyển đến đơn vị #' || p_den_don_vi_id;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, den_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT unnest(p_mang_uid), p_tu_don_vi_id, p_den_don_vi_id, 'NhapKho','Nhập kho từ đơn vị #' || p_tu_don_vi_id;

    FOR r IN (
        SELECT lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.uid = ANY(p_mang_uid)
        GROUP BY lt.duoc_pham_id, lt.quy_cach_id
    ) LOOP
        UPDATE TonKho
        SET so_luong_ton  = so_luong_ton - r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE don_vi_id    = p_tu_don_vi_id
          AND duoc_pham_id = r.duoc_pham_id
          AND quy_cach_id  = r.quy_cach_id;

        INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
        VALUES (p_den_don_vi_id, r.duoc_pham_id, r.quy_cach_id, r.sl)
        ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id) DO UPDATE
        SET so_luong_ton  = TonKho.so_luong_ton + r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
    END LOOP;
END; $$;
