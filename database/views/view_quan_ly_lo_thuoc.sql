-- ========================================================
-- View: view_quan_ly_lo_thuoc
-- Description: Batch and Lot Inventory Monitor View
-- ========================================================

CREATE OR REPLACE VIEW public.view_quan_ly_lo_thuoc AS
SELECT 
    lt.id AS lo_thuoc_id,
    lt.so_lo,
    dp.id AS duoc_pham_id,
    dp.ten_thuoc,
    dp.so_dang_ky,
    dp.hoat_chat,
    dp.ham_luong,
    qc.ten_don_vi AS don_vi_dong_goi,
    lt.ngay_san_xuat,
    lt.han_su_dung,
    lt.so_luong_nhap,
    lt.so_luong_con_lai,
    lt.trang_thai AS trang_thai_lo,
    lt.certificate_co_cq,
    CURRENT_DATE AS ngay_hien_tai,
    (lt.han_su_dung - CURRENT_DATE) AS so_ngay_con_lai,
    CASE 
        WHEN lt.han_su_dung < CURRENT_DATE THEN 'DA_HET_HAN'
        WHEN (lt.han_su_dung - CURRENT_DATE) <= 90 THEN 'SAP_HET_HAN'
        ELSE 'CON_HAN'
    END AS canh_bao_han_dung
FROM public.lothuoc lt
JOIN public.duocpham dp ON lt.duoc_pham_id = dp.id
LEFT JOIN public.quycachdonggoi qc ON dp.quy_cach_id = qc.id;
