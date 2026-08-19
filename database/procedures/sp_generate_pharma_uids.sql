-- ========================================================
-- Stored Procedure: sp_generate_pharma_uids
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_generate_pharma_uids(IN p_lo_thuoc_id integer, IN p_so_luong integer, IN p_don_vi_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE 
    v_uid UUID;
BEGIN 
    FOR i IN 1..p_so_luong LOOP 
        INSERT INTO HopThuoc (lo_thuoc_id, don_vi_hien_tai_id, trang_thai) 
        VALUES (p_lo_thuoc_id, p_don_vi_id, 'XuatXuong') 
        RETURNING uid INTO v_uid;

        INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu) 
        VALUES (v_uid, p_don_vi_id, 'KhoiTao', 'Khởi tạo định danh UID cho từng hộp thuốc thuộc lô thuốc #' || p_lo_thuoc_id); 
    END LOOP; 
END; $$;
