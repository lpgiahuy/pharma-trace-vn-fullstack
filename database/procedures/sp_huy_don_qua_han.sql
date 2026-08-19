-- ========================================================
-- Stored Procedure: sp_huy_don_qua_han
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_huy_don_qua_han()
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Bước 1: Hoàn kho cho tất cả đơn quá hạn
    -- SET-based thay vì loop từng đơn → hiệu quả hơn khi batch
    INSERT INTO TonKho (don_vi_id, duoc_pham_id, quy_cach_id, so_luong_ton)
    SELECT
        ctd.don_vi_xuat_id,
        ctd.duoc_pham_id,
        ctd.quy_cach_id,
        SUM(ctd.so_luong)
    FROM ChiTietDonHang ctd
    JOIN DonHang dh ON ctd.don_hang_id = dh.id
    WHERE dh.trang_thai_don = 'ChoXacNhan'
      AND dh.ngay_dat_hang < CURRENT_TIMESTAMP - INTERVAL '3 days'
    GROUP BY ctd.don_vi_xuat_id, ctd.duoc_pham_id, ctd.quy_cach_id
    ON CONFLICT (don_vi_id, duoc_pham_id, quy_cach_id)
    DO UPDATE SET
        so_luong_ton = TonKho.so_luong_ton + EXCLUDED.so_luong_ton,
        ngay_cap_nhat = CURRENT_TIMESTAMP;

    -- Bước 2: Hoàn điểm tích lũy
    -- Trigger trg_auto_upgrade_tier sẽ tự tính lại hạng thành viên
    UPDATE KhachHang kh
    SET diem_tich_luy = kh.diem_tich_luy + sub.tong_diem
    FROM (
        SELECT khach_hang_id, SUM(diem_su_dung) AS tong_diem
        FROM DonHang
        WHERE trang_thai_don = 'ChoXacNhan'
          AND ngay_dat_hang < CURRENT_TIMESTAMP - INTERVAL '3 days'
          AND diem_su_dung > 0
        GROUP BY khach_hang_id
    ) sub
    WHERE kh.id = sub.khach_hang_id;

    -- Bước 3: Hoàn lượt dùng voucher
    UPDATE KhuyenMai km
    SET so_luong_da_dung = GREATEST(km.so_luong_da_dung - sub.so_luong_huy, 0)
    FROM (
        SELECT ma_giam_gia, COUNT(*) AS so_luong_huy
        FROM DonHang
        WHERE trang_thai_don = 'ChoXacNhan'
          AND ngay_dat_hang < CURRENT_TIMESTAMP - INTERVAL '3 days'
          AND ma_giam_gia IS NOT NULL
          AND TRIM(ma_giam_gia) != ''
        GROUP BY ma_giam_gia
    ) sub
    WHERE km.ma_code = sub.ma_giam_gia;

    -- Bước 4: Cập nhật trạng thái — PHẢI làm cuối cùng
    -- Nếu làm trước, WHERE ChoXacNhan ở bước 1-3 sẽ không khớp nữa
    UPDATE DonHang
    SET trang_thai_don = 'DaHuy'
    WHERE trang_thai_don = 'ChoXacNhan'
      AND ngay_dat_hang < CURRENT_TIMESTAMP - INTERVAL '3 days';

END; $$;
