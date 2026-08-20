-- Trigger: trg_tru_ton_kho
CREATE OR REPLACE FUNCTION public.trg_tru_ton_kho()
RETURNS trigger AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
