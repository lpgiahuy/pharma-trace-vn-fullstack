-- ========================================================
-- PHARMATRACE VN - MASTER DATABASE INITIALIZATION ENTRYPOINT
-- Architecture: Enterprise Modular PostgreSQL
-- Execution Order:
--   1. Security & App User
--   2. Core Schemas & Tables (01 to 08)
--   3. Functions (Business & Geo Calculation)
--   4. Stored Procedures (Transactions)
--   5. Triggers (Automation & Auditing)
--   6. Views (Reports & Dashboards)
--   7. Row Level Security (RLS Policies)
-- ========================================================

-- 1. Security & User Setup
\i /docker-entrypoint-initdb.d/security/00_create_app_user.sql

-- 2. Schemas & Tables
\i /docker-entrypoint-initdb.d/schemas/01_core_master_tables.sql
\i /docker-entrypoint-initdb.d/schemas/02_inventory_tracking.sql
\i /docker-entrypoint-initdb.d/schemas/03_orders_prescriptions.sql
\i /docker-entrypoint-initdb.d/schemas/04_procurement_po.sql
\i /docker-entrypoint-initdb.d/schemas/05_logistics_cod.sql
\i /docker-entrypoint-initdb.d/schemas/06_qr_fraud_anomaly.sql
\i /docker-entrypoint-initdb.d/schemas/07_crm_loyalty_rma.sql
\i /docker-entrypoint-initdb.d/schemas/08_finance_ar_ap.sql

-- 3. Functions
\i /docker-entrypoint-initdb.d/functions/fn_calculate_shipping_fee.sql
\i /docker-entrypoint-initdb.d/functions/fn_check_qr_risk_score.sql
\i /docker-entrypoint-initdb.d/functions/fn_find_nearest_pharmacies.sql
\i /docker-entrypoint-initdb.d/functions/fn_get_loyalty_upgrade_progress.sql
\i /docker-entrypoint-initdb.d/functions/fn_haversine_distance.sql
\i /docker-entrypoint-initdb.d/functions/fn_tinh_khoang_cach_km.sql
\i /docker-entrypoint-initdb.d/functions/fn_tinh_tien_thanh_toan.sql
\i /docker-entrypoint-initdb.d/functions/fn_tinh_tong_ton_kho.sql
\i /docker-entrypoint-initdb.d/functions/fn_truy_vet_nha_may.sql
\i /docker-entrypoint-initdb.d/functions/fn_update_customer_rank.sql

-- 4. Stored Procedures
\i /docker-entrypoint-initdb.d/procedures/sp_bao_cao_doanh_thu_control_break.sql
\i /docker-entrypoint-initdb.d/procedures/sp_cap_nhat_lo_het_han.sql
\i /docker-entrypoint-initdb.d/procedures/sp_dong_goi_don_hang.sql
\i /docker-entrypoint-initdb.d/procedures/sp_generate_pharma_uids.sql
\i /docker-entrypoint-initdb.d/procedures/sp_hoan_thanh_don_hang.sql
\i /docker-entrypoint-initdb.d/procedures/sp_hoan_tra_thuoc.sql
\i /docker-entrypoint-initdb.d/procedures/sp_huy_don_hang_khach.sql
\i /docker-entrypoint-initdb.d/procedures/sp_huy_don_qua_han.sql
\i /docker-entrypoint-initdb.d/procedures/sp_kiem_ke_ton_kho.sql
\i /docker-entrypoint-initdb.d/procedures/sp_luan_chuyen_kho.sql
\i /docker-entrypoint-initdb.d/procedures/sp_luan_chuyen_kien_hang.sql
\i /docker-entrypoint-initdb.d/procedures/sp_nhap_kho_lo_thuoc_moi.sql
\i /docker-entrypoint-initdb.d/procedures/sp_phan_bo_xuat_kho_fefo.sql
\i /docker-entrypoint-initdb.d/procedures/sp_phan_tich_abc_ton_kho.sql
\i /docker-entrypoint-initdb.d/procedures/sp_phat_hien_qr_bat_thuong.sql
\i /docker-entrypoint-initdb.d/procedures/sp_tao_don_hang_tu_gio.sql
\i /docker-entrypoint-initdb.d/procedures/sp_thu_hoi_hang_loat.sql
\i /docker-entrypoint-initdb.d/procedures/sp_thu_hoi_lo_thuoc.sql
\i /docker-entrypoint-initdb.d/procedures/sp_tu_choi_toa_thuoc_qua_han.sql
\i /docker-entrypoint-initdb.d/procedures/sp_xac_nhan_hoan_tat_sau_7_ngay.sql
\i /docker-entrypoint-initdb.d/procedures/sp_xuat_giao_don_hang.sql
\i /docker-entrypoint-initdb.d/procedures/sp_xuat_huy_thuoc.sql

-- 5. Triggers
\i /docker-entrypoint-initdb.d/triggers/trg_auto_deduct_inventory_from_order.sql
\i /docker-entrypoint-initdb.d/triggers/trg_auto_upgrade_tier.sql
\i /docker-entrypoint-initdb.d/triggers/trg_block_fake_uid.sql
\i /docker-entrypoint-initdb.d/triggers/trg_handle_discount_logic.sql
\i /docker-entrypoint-initdb.d/triggers/trg_prevent_expired_delivery.sql
\i /docker-entrypoint-initdb.d/triggers/trg_sync_don_hang_to_vanchuyen.sql
\i /docker-entrypoint-initdb.d/triggers/trg_tru_ton_kho.sql
\i /docker-entrypoint-initdb.d/triggers/trg_update_diem_danh_gia.sql
\i /docker-entrypoint-initdb.d/triggers/trg_validate_phieu_tra_hang.sql

-- 6. Views
\i /docker-entrypoint-initdb.d/views/view_quan_ly_lo_thuoc.sql

-- 7. Row Level Security (RLS)
\i /docker-entrypoint-initdb.d/security/rls_policies.sql
