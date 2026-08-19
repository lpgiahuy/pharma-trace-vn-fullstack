-- Trigger: trg_auto_deduct_inventory_from_order
CREATE OR REPLACE FUNCTION public.trg_auto_deduct_inventory_from_order()
RETURNS trigger AS $$
BEGIN
    UPDATE public.tonkho_donvi
    SET so_luong_ton = GREATEST(0, so_luong_ton - NEW.so_luong),
        ngay_cap_nhat = CURRENT_TIMESTAMP
    WHERE duoc_pham_id = NEW.duoc_pham_id
      AND quy_cach_id = NEW.quy_cach_id
      AND don_vi_id = (SELECT don_vi_xuat_id FROM public.donhang WHERE id = NEW.don_hang_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_insert_chitietdonhang ON public.chitietdonhang;
CREATE TRIGGER trg_after_insert_chitietdonhang
AFTER INSERT ON public.chitietdonhang
FOR EACH ROW EXECUTE FUNCTION public.trg_auto_deduct_inventory_from_order();
