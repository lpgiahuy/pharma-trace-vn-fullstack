-- Trigger: trg_auto_upgrade_tier
CREATE OR REPLACE FUNCTION public.trg_auto_upgrade_tier()
RETURNS trigger AS $$
BEGIN
    PERFORM public.fn_update_customer_rank(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_upgrade_tier_khachhang ON public.khachhang;
CREATE TRIGGER trg_upgrade_tier_khachhang
AFTER UPDATE OF diem_tich_luy ON public.khachhang
FOR EACH ROW EXECUTE FUNCTION public.trg_auto_upgrade_tier();
