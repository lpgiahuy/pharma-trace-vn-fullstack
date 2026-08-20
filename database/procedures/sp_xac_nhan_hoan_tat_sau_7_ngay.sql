-- ========================================================
-- Stored Procedure: sp_xac_nhan_hoan_tat_sau_7_ngay
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_xac_nhan_hoan_tat_sau_7_ngay()
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Tính 1 lần, dùng cho cả 2 UPDATE bên dưới
    CREATE TEMP TABLE t_du_dieu_kien AS
    SELECT
        dh.id           AS don_hang_id,
        dh.khach_hang_id,
        FLOOR(dh.tong_tien / 1000)::INT AS diem
    FROM DonHang dh
    WHERE dh.trang_thai_don = 'ChoHoanTat'
      AND (
          SELECT MAX(lsp.thoi_gian)
          FROM LichSuPhanPhoi lsp
          JOIN HopThuoc ht ON ht.uid = lsp.hop_thuoc_uid
          WHERE ht.don_hang_id       = dh.id
            AND lsp.loai_giao_dich   = 'GiaoChoKhach'
      ) <= CURRENT_TIMESTAMP - INTERVAL '7 days';

    UPDATE KhachHang kh
	SET diem_tich_luy = kh.diem_tich_luy + t.diem,
	    diem_tich_luy_tong = kh.diem_tich_luy_tong + t.diem
	FROM t_du_dieu_kien t
	WHERE kh.id = t.khach_hang_id;

    UPDATE DonHang
    SET trang_thai_don = 'HoanThanh'
    WHERE id IN (SELECT don_hang_id FROM t_du_dieu_kien);

    DROP TABLE t_du_dieu_kien;
END;
$$;
