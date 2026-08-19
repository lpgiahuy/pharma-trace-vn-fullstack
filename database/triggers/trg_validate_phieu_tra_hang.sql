-- Trigger: trg_validate_phieu_tra_hang
CREATE OR REPLACE FUNCTION public.trg_validate_phieu_tra_hang()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.donhang WHERE id = NEW.don_hang_id) THEN
        RAISE EXCEPTION 'Đơn hàng ID % không tồn tại để thực hiện hoàn trả!', NEW.don_hang_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
