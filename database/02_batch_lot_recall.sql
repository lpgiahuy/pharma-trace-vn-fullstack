-- ==========================================================
-- Module 2: Quản lý Lô & Hạn Sử Dụng / Thu Hồi Sản Phẩm (FEFO & Recall)
-- Sub-system: PharmaTrace VN
-- ==========================================================

-- 1. View hỗ trợ Quản lý Lô & Cảnh báo Hạn Sử Dụng (FEFO)
CREATE OR REPLACE VIEW public.view_quan_ly_lo_thuoc AS
SELECT 
    lt.id,
    lt.so_lo,
    lt.duoc_pham_id,
    dp.ten_thuoc,
    lt.quy_cach_id,
    qc.ten_don_vi AS ten_quy_cach,
    lt.ngay_san_xuat,
    lt.han_su_dung,
    (lt.han_su_dung - CURRENT_DATE) AS ngay_con_han,
    lt.trang_thai AS trang_thai_goc,
    CASE 
        WHEN lt.trang_thai = 'ThuHoi' THEN 'ThuHoi'
        WHEN lt.han_su_dung < CURRENT_DATE THEN 'HetHan'
        WHEN (lt.han_su_dung - CURRENT_DATE) <= 60 THEN 'CanDate'
        ELSE 'HopLe'
    END AS trang_thai_hsd
FROM public.lothuoc lt
LEFT JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
LEFT JOIN public.quycachdonggoi qc ON lt.quy_cach_id = qc.id;

-- 2. Dữ liệu mẫu thử nghiệm (Sample Test Data for Batches)
-- Lưu ý: Sử dụng sản phẩm ID 991 làm mẫu thử nghiệm

INSERT INTO public.lothuoc (duoc_pham_id, so_lo, ngay_san_xuat, han_su_dung, trang_thai)
VALUES 
    (991, 'BATCH-2026-001', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '18 months', 'HopLe'),
    (991, 'BATCH-2026-002', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '25 days', 'HopLe'),
    (991, 'BATCH-2025-EXPIRED', '2024-01-01', '2025-12-31', 'HetHan'),
    (991, 'BATCH-RECALL-999', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '12 months', 'ThuHoi')
ON CONFLICT DO NOTHING;
