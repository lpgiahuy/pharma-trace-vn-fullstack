-- Trigger: trg_block_fake_uid
CREATE OR REPLACE FUNCTION public.trg_block_fake_uid()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.hopthuoc WHERE uid = NEW.hop_thuoc_uid) THEN
        RAISE EXCEPTION 'Mã UID % không tồn tại trong hệ thống hoặc không hợp lệ!', NEW.hop_thuoc_uid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
