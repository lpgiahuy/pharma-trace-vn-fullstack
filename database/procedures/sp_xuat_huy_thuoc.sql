-- ========================================================
-- Stored Procedure: sp_xuat_huy_thuoc
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_xuat_huy_thuoc(IN p_don_vi_id integer, IN p_mang_uid uuid[], IN p_ly_do text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    r             RECORD;
    v_count       INT;
    v_input_count INT;
BEGIN
    v_input_count := COALESCE(array_length(p_mang_uid, 1), 0);
    IF v_input_count = 0 THEN
        RAISE EXCEPTION 'Danh sách mã UID trống!';
    END IF;

    -- Trừ TonKho TRƯỚC khi update trang_thai (đọc trang_thai gốc)
    -- Chỉ trừ hộp TrongKho / XuatXuong — hộp ThuHoi đã được xử lý
    -- bởi sp_thu_hoi_lo_thuoc hoặc đã không còn trong TonKho
    FOR r IN (
        SELECT lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.uid                  = ANY(p_mang_uid)
          AND ht.don_vi_hien_tai_id   = p_don_vi_id
          AND ht.trang_thai           IN ('TrongKho', 'XuatXuong')
        GROUP BY lt.duoc_pham_id, lt.quy_cach_id
    ) LOOP
        UPDATE TonKho
        SET so_luong_ton  = so_luong_ton - r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE don_vi_id    = p_don_vi_id
          AND duoc_pham_id = r.duoc_pham_id
          AND quy_cach_id  = r.quy_cach_id;
    END LOOP;

    -- Đánh dấu HuyBo (bao gồm cả hộp ThuHoi trả về từ khách)
    UPDATE HopThuoc
    SET trang_thai = 'HuyBo'
    WHERE uid                = ANY(p_mang_uid)
      AND don_vi_hien_tai_id = p_don_vi_id
      AND trang_thai         IN ('TrongKho', 'XuatXuong', 'ThuHoi');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> v_input_count THEN
        RAISE EXCEPTION
            'Lỗi: %/% hộp thuốc không hợp lệ để xuất hủy (sai đơn vị, sai trạng thái, hoặc không tồn tại)!',
            (v_input_count - v_count), v_input_count;
    END IF;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT unnest(p_mang_uid), p_don_vi_id, 'XuatHuy', p_ly_do;
END;
$$;
