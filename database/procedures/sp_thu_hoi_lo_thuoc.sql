-- ========================================================
-- Stored Procedure: sp_thu_hoi_lo_thuoc
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_thu_hoi_lo_thuoc(IN p_lo_thuoc_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE LoThuoc SET trang_thai = 'ThuHoi' WHERE id = p_lo_thuoc_id;

    UPDATE HopThuoc
    SET trang_thai = 'ThuHoi'
    WHERE lo_thuoc_id = p_lo_thuoc_id AND trang_thai != 'HuyBo';

    UPDATE TonKho tk
    SET so_luong_ton = GREATEST(tk.so_luong_ton - sub.sl, 0),
        ngay_cap_nhat = CURRENT_TIMESTAMP
    FROM (
        SELECT
            ht.don_vi_hien_tai_id AS don_vi_id,
            lt.duoc_pham_id,
            lt.quy_cach_id,
            COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE ht.lo_thuoc_id = p_lo_thuoc_id
          AND ht.trang_thai = 'ThuHoi'
          AND lt.trang_thai = 'ThuHoi'
          AND (
              SELECT lsp.loai_giao_dich
              FROM LichSuPhanPhoi lsp
              WHERE lsp.hop_thuoc_uid = ht.uid
              ORDER BY lsp.thoi_gian DESC, lsp.id DESC
              LIMIT 1
          ) IS DISTINCT FROM 'GiaoChoKhach'
        GROUP BY ht.don_vi_hien_tai_id, lt.duoc_pham_id, lt.quy_cach_id
    ) sub
    WHERE tk.don_vi_id = sub.don_vi_id
      AND tk.duoc_pham_id = sub.duoc_pham_id
      AND tk.quy_cach_id = sub.quy_cach_id;

    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, loai_giao_dich)
    SELECT uid, 'ThuHoi'
    FROM HopThuoc
    WHERE lo_thuoc_id = p_lo_thuoc_id AND trang_thai = 'ThuHoi';
END; $$;
