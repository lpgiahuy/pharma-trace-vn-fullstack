-- Trigger: trg_update_diem_danh_gia
CREATE OR REPLACE FUNCTION public.trg_update_diem_danh_gia()
RETURNS trigger AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_review_rating ON public.danhgia_sanpham;
CREATE TRIGGER trg_after_review_rating
AFTER INSERT ON public.danhgia_sanpham
FOR EACH ROW EXECUTE FUNCTION public.trg_update_diem_danh_gia();
