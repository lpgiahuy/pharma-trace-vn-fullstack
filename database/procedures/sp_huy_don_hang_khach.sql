-- ========================================================
-- Stored Procedure: sp_huy_don_hang_khach
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_huy_don_hang_khach(IN p_don_hang_id integer, IN p_khach_hang_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE 
    v_trang_thai VARCHAR;
    v_diem_su_dung INT;
    v_ma_giam_gia VARCHAR;
    r RECORD;
BEGIN
    SELECT trang_thai_don, diem_su_dung, ma_giam_gia 
    INTO v_trang_thai, v_diem_su_dung, v_ma_giam_gia 
    FROM DonHang 
    WHERE id = p_don_hang_id AND khach_hang_id = p_khach_hang_id;
    
    IF v_trang_thai IS NULL THEN 
        RAISE EXCEPTION 'Đơn hàng không tồn tại!'; 
    END IF;

    IF v_trang_thai != 'ChoXacNhan' THEN 
        RAISE EXCEPTION 'Không thể hủy đơn hàng đang ở trạng thái: %', v_trang_thai; 
    END IF;

    UPDATE DonHang 
    SET trang_thai_don = 'DaHuy'
    WHERE id = p_don_hang_id;

    FOR r IN (
        SELECT 
            duoc_pham_id,
            quy_cach_id,
            don_vi_xuat_id,
            SUM(so_luong) as tong_so_luong 
        FROM ChiTietDonHang
        WHERE don_hang_id = p_don_hang_id
        GROUP BY duoc_pham_id, quy_cach_id, don_vi_xuat_id
    ) LOOP
        INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
        VALUES (r.don_vi_xuat_id, r.duoc_pham_id, r.quy_cach_id, r.tong_so_luong)
        ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id)
        DO UPDATE SET 
            so_luong_ton = TonKho.so_luong_ton + r.tong_so_luong,
            ngay_cap_nhat = CURRENT_TIMESTAMP;
    END LOOP;

    IF v_diem_su_dung > 0 THEN
        UPDATE KhachHang 
        SET diem_tich_luy = diem_tich_luy + v_diem_su_dung
        WHERE id = p_khach_hang_id;
    END IF;

    IF v_ma_giam_gia IS NOT NULL AND v_ma_giam_gia != '' THEN
        UPDATE KhuyenMai 
        SET so_luong_da_dung = GREATEST(so_luong_da_dung - 1, 0)
        WHERE ma_code = v_ma_giam_gia;
    END IF;

END; $$;
