-- ========================================================
-- Stored Procedure: sp_dong_goi_don_hang
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_dong_goi_don_hang(IN p_don_hang_id integer, IN p_mang_uid uuid[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_trang_thai_don VARCHAR(50);
    v_mismatch RECORD;
    v_count INT;
BEGIN
    SELECT trang_thai_don INTO v_trang_thai_don
    FROM DonHang WHERE id = p_don_hang_id;

    IF v_trang_thai_don IS NULL THEN
        RAISE EXCEPTION 'Đơn hàng ID % không tồn tại!', p_don_hang_id;
    END IF;

    IF v_trang_thai_don != 'ChoXacNhan' THEN
        RAISE EXCEPTION 'Chỉ có thể đóng gói đơn ở trạng thái ChoXacNhan. Hiện tại: %',
            v_trang_thai_don;
    END IF;

    IF EXISTS (
        SELECT 1 FROM HopThuoc
        WHERE uid = ANY(p_mang_uid)
          AND (trang_thai NOT IN ('TrongKho', 'XuatXuong') OR don_hang_id IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'Có hộp thuốc không khả dụng (đã bán, đang giao hoặc thuộc đơn hàng khác)!';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(p_mang_uid) AS list(uid)
        JOIN HopThuoc ht ON list.uid = ht.uid
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE (lt.duoc_pham_id, lt.quy_cach_id) NOT IN (
            SELECT duoc_pham_id, quy_cach_id
            FROM ChiTietDonHang
            WHERE don_hang_id = p_don_hang_id
        )
    ) THEN
        RAISE EXCEPTION 'Có hộp thuốc sai loại hoặc sai quy cách so với đơn hàng!';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(p_mang_uid) AS list(uid)
        JOIN HopThuoc ht ON list.uid = ht.uid
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        JOIN ChiTietDonHang ctd
            ON lt.duoc_pham_id = ctd.duoc_pham_id
           AND lt.quy_cach_id  = ctd.quy_cach_id
           AND ctd.don_hang_id = p_don_hang_id
        WHERE ht.don_vi_hien_tai_id <> ctd.don_vi_xuat_id
    ) THEN
        RAISE EXCEPTION 'Có hộp thuốc không thuộc kho xuất hàng của đơn!';
    END IF;

    SELECT ctd.duoc_pham_id, ctd.quy_cach_id, ctd.so_luong AS can_dong_goi, COALESCE(box.so_hop, 0) AS thuc_te INTO v_mismatch
    FROM ChiTietDonHang ctd
    LEFT JOIN (
        SELECT lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS so_hop
        FROM unnest(p_mang_uid) AS list(uid)
        JOIN HopThuoc ht ON list.uid = ht.uid
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        GROUP BY lt.duoc_pham_id, lt.quy_cach_id
    ) box ON ctd.duoc_pham_id = box.duoc_pham_id
         AND ctd.quy_cach_id  = box.quy_cach_id
    WHERE ctd.don_hang_id = p_don_hang_id
      AND ctd.so_luong != COALESCE(box.so_hop, 0)
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Số lượng không khớp: sản phẩm ID % (quy cách: %). Cần % hộp, thực tế: % hộp',
            v_mismatch.duoc_pham_id, v_mismatch.quy_cach_id,
            v_mismatch.can_dong_goi, v_mismatch.thuc_te;
    END IF;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT uid, don_vi_hien_tai_id, 'DongGoi', 'Đóng gói cho đơn hàng ID: ' || p_don_hang_id
    FROM HopThuoc
    WHERE uid = ANY(p_mang_uid);

    UPDATE HopThuoc
    SET don_hang_id = p_don_hang_id,
        trang_thai  = 'DaDongGoi'
    WHERE uid = ANY(p_mang_uid)
      AND trang_thai IN ('TrongKho', 'XuatXuong')
      AND don_hang_id IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> array_length(p_mang_uid, 1) THEN
        RAISE EXCEPTION 'Xung đột: % hộp thuốc vừa bị tiến trình khác lấy mất. Vui lòng thử lại.',
            array_length(p_mang_uid, 1) - v_count;
    END IF;

    UPDATE DonHang SET trang_thai_don = 'DaDongGoi' WHERE id = p_don_hang_id;

END; $$;
