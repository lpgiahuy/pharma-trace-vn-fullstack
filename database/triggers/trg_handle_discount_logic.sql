-- Trigger: trg_handle_discount_logic
CREATE OR REPLACE FUNCTION public.trg_handle_discount_logic()
RETURNS trigger AS $$
BEGIN
    IF NEW.ma_giam_gia IS NOT NULL AND NEW.ma_giam_gia <> '' THEN
        UPDATE public.makhuyenmai
        SET so_luong_da_dung = so_luong_da_dung + 1
        WHERE ma_code = NEW.ma_giam_gia;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_discount_donhang ON public.donhang;
CREATE TRIGGER trg_handle_discount_donhang
AFTER INSERT ON public.donhang
FOR EACH ROW EXECUTE FUNCTION public.trg_handle_discount_logic();
