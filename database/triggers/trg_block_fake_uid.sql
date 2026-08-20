-- Trigger: trg_block_fake_uid
CREATE OR REPLACE FUNCTION public.trg_block_fake_uid()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.mahop_uid WHERE uid = NEW.uid) THEN
        RAISE EXCEPTION 'Mã UID % không tồn tại trong hệ thống hoặc không hợp lệ!', NEW.uid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
