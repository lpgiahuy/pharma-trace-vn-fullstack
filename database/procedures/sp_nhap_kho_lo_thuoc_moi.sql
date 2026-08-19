-- ========================================================
-- Stored Procedure: sp_nhap_kho_lo_thuoc_moi
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_nhap_kho_lo_thuoc_moi(IN p_lo_thuoc_id integer, IN p_don_vi_id integer, IN p_so_luong_hop integer, IN p_ghi_chu text DEFAULT NULL::text)
    LANGUAGE plpgsql
    AS $$
DECLARE 
	v_duoc_pham_id INT; v_quy_cach_id INT; v_trang_thai_lo VARCHAR(50);
BEGIN
    SELECT duoc_pham_id, quy_cach_id, trang_thai
    INTO v_duoc_pham_id, v_quy_cach_id, v_trang_thai_lo
    FROM LoThuoc
    WHERE id = p_lo_thuoc_id;

    IF v_duoc_pham_id IS NULL THEN
        RAISE EXCEPTION 'Lô thuốc ID % không tồn tại!', p_lo_thuoc_id;
    END IF;

    IF v_trang_thai_lo != 'HopLe' THEN
        RAISE EXCEPTION 'Lô thuốc không hợp lệ để nhập. Trạng thái hiện tại: %', v_trang_thai_lo;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM QuyCachDongGoi
        WHERE id = v_quy_cach_id AND duoc_pham_id = v_duoc_pham_id
    ) THEN
        RAISE EXCEPTION 'Quy cách đóng gói % không tồn tại cho thuốc %', v_quy_cach_id, v_duoc_pham_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM DonVi WHERE id = p_don_vi_id) THEN
        RAISE EXCEPTION 'Kho (ID: %) không tồn tại!', p_don_vi_id;
    END IF;

    INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
    VALUES (p_don_vi_id, v_duoc_pham_id, v_quy_cach_id, p_so_luong_hop)
    ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id) DO UPDATE
    SET so_luong_ton  = TonKho.so_luong_ton + p_so_luong_hop,
        ngay_cap_nhat = CURRENT_TIMESTAMP;

    CALL sp_Generate_Pharma_UIDs(p_lo_thuoc_id, p_so_luong_hop, p_don_vi_id);

    WITH hop_vua_nhap AS (
        UPDATE HopThuoc
        SET trang_thai = 'TrongKho'
        WHERE lo_thuoc_id      = p_lo_thuoc_id
          AND don_vi_hien_tai_id = p_don_vi_id
          AND trang_thai       = 'XuatXuong'
        RETURNING uid
    )
    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT uid, p_don_vi_id, 'NhapKho', 'Nhập kho lô ' || p_lo_thuoc_id || ' - ' || COALESCE(p_ghi_chu, 'Nhập kho')
    FROM hop_vua_nhap;

    RAISE NOTICE 'Nhập kho thành công: % hộp từ lô thuốc ID %', p_so_luong_hop, p_lo_thuoc_id;
END; $$;
