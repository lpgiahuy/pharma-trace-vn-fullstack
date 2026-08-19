-- ========================================================
-- Stored Procedure: sp_cap_nhat_lo_het_han
-- Description: Enterprise transaction logic for PharmaTrace
-- ========================================================

CREATE OR REPLACE PROCEDURE public.sp_cap_nhat_lo_het_han()
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE LoThuoc SET trang_thai = 'HetHan'
    WHERE han_su_dung < CURRENT_DATE
        AND trang_thai = 'HopLe';

    -- Trừ TonKho cho các hộp 'TrongKho' thuộc lô vừa hết hạn
    UPDATE TonKho tk
    SET so_luong_ton  = GREATEST(tk.so_luong_ton - sub.sl, 0),
        ngay_cap_nhat = CURRENT_TIMESTAMP
    FROM (
        SELECT ht.don_vi_hien_tai_id AS don_vi_id,
               lt.duoc_pham_id, lt.quy_cach_id, COUNT(*) AS sl
        FROM HopThuoc ht
        JOIN LoThuoc lt ON ht.lo_thuoc_id = lt.id
        WHERE lt.trang_thai = 'HetHan'
          AND ht.trang_thai = 'TrongKho'
        GROUP BY ht.don_vi_hien_tai_id, lt.duoc_pham_id, lt.quy_cach_id
    ) sub
    WHERE tk.don_vi_id    = sub.don_vi_id
      AND tk.duoc_pham_id = sub.duoc_pham_id
      AND tk.quy_cach_id  = sub.quy_cach_id;

    -- Đánh dấu HuyBo và ghi lịch sử phân phối trong một bước
    WITH hop_vua_huy AS (
        UPDATE HopThuoc ht
        SET trang_thai = 'HuyBo'
        FROM LoThuoc lt
        WHERE ht.lo_thuoc_id = lt.id
          AND lt.trang_thai  = 'HetHan'
          AND ht.trang_thai  = 'TrongKho'
        RETURNING ht.uid, ht.don_vi_hien_tai_id
    )
    INSERT INTO LichSuPhanPhoi (hop_thuoc_uid, tu_don_vi_id, loai_giao_dich, ghi_chu)
    SELECT uid, don_vi_hien_tai_id, 'XuatHuy', 'Tự động hủy: thuộc lô đã hết hạn sử dụng'
    FROM hop_vua_huy;
END; $$;
