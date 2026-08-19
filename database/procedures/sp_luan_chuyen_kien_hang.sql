-- ========================================================
-- Stored Procedure: sp_luan_chuyen_kien_hang
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_luan_chuyen_kien_hang(IN p_ma_sscc character varying, IN p_den_don_vi_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_kien_id INT;
    v_tu_don_vi_id INT;
    r RECORD;
BEGIN
    SELECT id, don_vi_so_huu_id INTO v_kien_id, v_tu_don_vi_id
    FROM KienHang WHERE ma_sscc = p_ma_sscc;

    IF v_kien_id IS NULL THEN
        RAISE EXCEPTION 'Mã SSCC kiện hàng (%) không tồn tại!', p_ma_sscc;
    END IF;

    UPDATE KienHang
    SET don_vi_so_huu_id = p_den_don_vi_id
    WHERE id = v_kien_id;

    UPDATE HopThuoc
    SET don_vi_hien_tai_id = p_den_don_vi_id
    WHERE kien_hang_id = v_kien_id;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, den_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT uid, v_tu_don_vi_id, p_den_don_vi_id, 'XuatKho', 'Xuất kho: Luân chuyển theo kiện SSCC: ' || p_ma_sscc
    FROM HopThuoc WHERE kien_hang_id = v_kien_id;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, den_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT uid, v_tu_don_vi_id, p_den_don_vi_id, 'NhapKho', 'Nhập kho: Luân chuyển theo kiện SSCC: ' || p_ma_sscc
    FROM HopThuoc WHERE kien_hang_id = v_kien_id;

    FOR r IN (
        SELECT lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.kien_hang_id = v_kien_id
        GROUP BY lt.duoc_pham_id, lt.quy_cach_id
    ) LOOP
        UPDATE TonKho
        SET so_luong_ton  = so_luong_ton - r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE don_vi_id    = v_tu_don_vi_id
          AND duoc_pham_id = r.duoc_pham_id
          AND quy_cach_id  = r.quy_cach_id;

        INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
        VALUES (p_den_don_vi_id, r.duoc_pham_id, r.quy_cach_id, r.sl)
        ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id) DO UPDATE
        SET so_luong_ton  = TonKho.so_luong_ton + r.sl,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
    END LOOP;
END; $$;
