-- Trigger: trg_sync_don_hang_to_vanchuyen
CREATE OR REPLACE FUNCTION public.trg_sync_don_hang_to_vanchuyen()
RETURNS trigger AS $$
BEGIN
    IF NEW.trang_thai_don_hang = 'DA_XAC_NHAN' AND (OLD.trang_thai_don_hang IS NULL OR OLD.trang_thai_don_hang <> 'DA_XAC_NHAN') THEN
        INSERT INTO public.vanchuyen (
            don_hang_id,
            ma_van_don,
            don_vi_van_chuyen,
            trang_thai_van_chuyen,
            tien_thu_ho_cod
        ) VALUES (
            NEW.id,
            'VC_' || NEW.ma_don_hang,
            'GiaoHangNhanh',
            'CHO_GIAO',
            CASE WHEN NEW.phuong_thuc_thanh_toan = 'COD' THEN NEW.tong_thanh_toan ELSE 0 END
        )
        ON CONFLICT (don_hang_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_don_hang_vanchuyen ON public.donhang;
CREATE TRIGGER trg_sync_don_hang_vanchuyen
AFTER UPDATE ON public.donhang
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_don_hang_to_vanchuyen();
