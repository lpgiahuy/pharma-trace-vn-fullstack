-- Trigger: trg_prevent_expired_delivery
CREATE OR REPLACE FUNCTION public.trg_prevent_expired_delivery()
RETURNS trigger AS $$
DECLARE
    v_han_dung DATE;
BEGIN
    SELECT lt.han_su_dung INTO v_han_dung
    FROM public.mahop_uid mu
    JOIN public.lothuoc lt ON mu.lo_thuoc_id = lt.id
    WHERE mu.uid = NEW.uid;

    IF v_han_dung IS NOT NULL AND v_han_dung < (CURRENT_DATE + INTERVAL '30 days') THEN
        RAISE EXCEPTION 'Không thể xuất giao hộp thuốc có hạn sử dụng dưới 30 ngày (HSD: %)!', v_han_dung;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
