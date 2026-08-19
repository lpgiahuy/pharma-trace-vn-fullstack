# 🏛️ PharmaTrace VN - Database Architecture & Schema Specification

Welcome to the **PharmaTrace VN** Enterprise PostgreSQL Database repository. This database engine powers end-to-end pharmaceutical supply chain traceability, anti-counterfeit cryptographic verification, inventory distribution, electronic prescriptions, and e-commerce transactions.

---

## 📁 Directory Structure

```
database/
├── 00_master_init.sql              # Master initialization orchestrator
├── README.md                       # Complete database architecture documentation
├── schemas/                        # Table DDL, constraints, primary & foreign keys
│   ├── 01_core_master_tables.sql   # Categories, packaging units, facilities, users, drug catalog
│   ├── 02_inventory_tracking.sql   # Batches, serialized box UIDs, SSCC logistics cartons, inventory
│   ├── 03_orders_prescriptions.sql # Orders, order details, e-prescriptions, cart, vouchers, reviews, blog
│   ├── 04_procurement_po.sql       # Suppliers, purchase orders (PO), inbound shipments
│   ├── 05_logistics_cod.sql        # Shipping logistics, COD reconciliation
│   ├── 06_qr_fraud_anomaly.sql     # QR scan logs, anomaly fraud detection, velocity violations
│   ├── 07_crm_loyalty_rma.sql      # Loyalty point ledger, member tiers, RMA return orders
│   └── 08_finance_ar_ap.sql        # Cashbook journal, customer AR & supplier AP ledgers
├── functions/                      # Business logic, mathematical & geospatial calculation functions
│   ├── fn_calculate_shipping_fee.sql
│   ├── fn_check_qr_risk_score.sql
│   ├── fn_find_nearest_pharmacies.sql
│   ├── fn_get_loyalty_upgrade_progress.sql
│   ├── fn_haversine_distance.sql
│   ├── fn_tinh_khoang_cach_km.sql
│   ├── fn_tinh_tien_thanh_toan.sql
│   ├── fn_tinh_tong_ton_kho.sql
│   ├── fn_truy_vet_nha_may.sql
│   └── fn_update_customer_rank.sql
├── procedures/                     # Atomic transactional stored procedures
│   ├── sp_bao_cao_doanh_thu_control_break.sql
│   ├── sp_cap_nhat_lo_het_han.sql
│   ├── sp_dong_goi_don_hang.sql
│   ├── sp_generate_pharma_uids.sql
│   ├── sp_hoan_thanh_don_hang.sql
│   ├── sp_hoan_tra_thuoc.sql
│   ├── sp_huy_don_hang_khach.sql
│   ├── sp_huy_don_qua_han.sql
│   ├── sp_kiem_ke_ton_kho.sql
│   ├── sp_luan_chuyen_kho.sql
│   ├── sp_luan_chuyen_kien_hang.sql
│   ├── sp_nhap_kho_lo_thuoc_moi.sql
│   ├── sp_phan_bo_xuat_kho_fefo.sql
│   ├── sp_phan_tich_abc_ton_kho.sql
│   ├── sp_phat_hien_qr_bat_thuong.sql
│   ├── sp_tao_don_hang_tu_gio.sql
│   ├── sp_thu_hoi_hang_loat.sql
│   ├── sp_thu_hoi_lo_thuoc.sql
│   ├── sp_tu_choi_toa_thuoc_qua_han.sql
│   ├── sp_xac_nhan_hoan_tat_sau_7_ngay.sql
│   ├── sp_xuat_giao_don_hang.sql
│   └── sp_xuat_huy_thuoc.sql
├── triggers/                       # Automated trigger handlers & validation hooks
│   ├── trg_auto_deduct_inventory_from_order.sql
│   ├── trg_auto_upgrade_tier.sql
│   ├── trg_block_fake_uid.sql
│   ├── trg_handle_discount_logic.sql
│   ├── trg_prevent_expired_delivery.sql
│   ├── trg_sync_don_hang_to_vanchuyen.sql
│   ├── trg_tru_ton_kho.sql
│   ├── trg_update_diem_danh_gia.sql
│   └── trg_validate_phieu_tra_hang.sql
├── views/                          # Materialized and analytical SQL views
│   └── view_quan_ly_lo_thuoc.sql
├── security/                       # Security roles & row-level security
│   ├── 00_create_app_user.sql      # Application role creation & grants
│   └── rls_policies.sql            # Multi-tenant Row-Level Security (RLS) policies
└── seeds/                          # Master data seeds & catalog initialization
```

---

## ⚡ Complete Stored Procedures Catalog (22 Procedures)

| # | Stored Procedure | Description |
|---|---|---|
| 1 | `sp_tao_don_hang_tu_gio` | Creates a new order from shopping cart items, validates stock, applies discount vouchers, computes shipping fees, and deducts reward points. |
| 2 | `sp_dong_goi_don_hang` | Assigns verified serialized box UIDs to order lines during the warehouse fulfillment packaging phase. |
| 3 | `sp_xuat_giao_don_hang` | Dispatches packed orders to courier logistics partners and updates unit inventory balances. |
| 4 | `sp_hoan_thanh_don_hang` | Marks order delivery as successfully completed, awards loyalty points, and settles COD payments. |
| 5 | `sp_huy_don_hang_khach` | Processes customer cancellation and safely restores reserved inventory back to available stock. |
| 6 | `sp_huy_don_qua_han` | Automatically scans and cancels pending unpaid orders past their payment window. |
| 7 | `sp_xac_nhan_hoan_tat_sau_7_ngay` | Auto-confirms delivered orders after 7 days if no RMA dispute is filed. |
| 8 | `sp_generate_pharma_uids` | Generates cryptographic serialized UUIDs with digital signatures for each manufactured medicine box. |
| 9 | `sp_nhap_kho_lo_thuoc_moi` | Ingests new pharmaceutical production batches into central or regional distribution warehouse stock. |
| 10 | `sp_phan_bo_xuat_kho_fefo` | Automatically allocates inventory using First-Expired, First-Out (FEFO) rules to minimize product spoilage. |
| 11 | `sp_luan_chuyen_kho` | Transfers individual medicine boxes between warehouses and pharmacy branch locations. |
| 12 | `sp_luan_chuyen_kien_hang` | Transfers bulk SSCC pallet shipments between logistics hubs. |
| 13 | `sp_kiem_ke_ton_kho` | Initiates scheduled stocktaking audits and calculates discrepancy variances. |
| 14 | `sp_phan_tich_abc_ton_kho` | Runs ABC classification analysis on warehouse inventory based on revenue velocity and turnover value. |
| 15 | `sp_cap_nhat_lo_het_han` | Identifies and flags expired medicine batches across all facilities to prevent accidental sales. |
| 16 | `sp_xuat_huy_thuoc` | Handles legal disposal and inventory write-offs for damaged or expired pharmaceuticals. |
| 17 | `sp_thu_hoi_lo_thuoc` | Triggers an immediate recall of a specific defective batch, locking all related UIDs across the supply chain. |
| 18 | `sp_thu_hoi_hang_loat` | Mass-recalls all products associated with a sanctioned manufacturer or regulatory alert. |
| 19 | `sp_hoan_tra_thuoc` | Processes Return Merchandise Authorization (RMA) from customers back to pharmacy inventory. |
| 20 | `sp_tu_choi_toa_thuoc_qua_han` | Automatically rejects unfulfilled electronic prescriptions older than 14 days. |
| 21 | `sp_phat_hien_qr_bat_thuong` | Detects physical counterfeit anomalies by analyzing impossible travel velocities between consecutive QR scans. |
| 22 | `sp_bao_cao_doanh_thu_control_break` | Generates multi-dimensional sales revenue reports grouped by period, branch, and category. |

---

## ⚡ Business Functions Catalog (10 Functions)

| # | Function Name | Return Type | Description |
|---|---|---|---|
| 1 | `fn_calculate_shipping_fee` | `NUMERIC` | Calculates dynamic delivery shipping rates based on straight-line and road distance tiers. |
| 2 | `fn_tinh_khoang_cach_km` | `DOUBLE PRECISION` | Standard Haversine distance calculator between two GPS coordinates (Latitude/Longitude). |
| 3 | `fn_haversine_distance` | `DOUBLE PRECISION` | High-precision geospatial distance function in kilometers/meters. |
| 4 | `fn_find_nearest_pharmacies` | `TABLE(...)` | Locates nearest pharmacy branches carrying stock for a requested drug and packaging unit. |
| 5 | `fn_tinh_tien_thanh_toan` | `NUMERIC` | Computes final order payable amounts factoring in vouchers, membership discounts, and reward points. |
| 6 | `fn_tinh_tong_ton_kho` | `INTEGER` | Returns real-time aggregate available stock across all enterprise facilities for a drug ID. |
| 7 | `fn_truy_vet_nha_may` | `VARCHAR` | Traces a box UID back to its originating pharmaceutical plant and certified batch number. |
| 8 | `fn_check_qr_risk_score` | `INTEGER (0-100)` | Calculates risk probability of QR cloning based on scan frequency and geographic travel velocity. |
| 9 | `fn_get_loyalty_upgrade_progress` | `TABLE(...)` | Returns customer membership tier, next tier threshold, and remaining points needed. |
| 10 | `fn_update_customer_rank` | `VOID` | Evaluates accumulated points and updates customer membership tier (`BRONZE`, `SILVER`, `GOLD`, `PLATINUM`). |

---

## ⚡ Triggers & Automated Auditing (8 Triggers)

1. `trg_auto_deduct_inventory_from_order`: Automatically deducts warehouse stock when an order is packed or shipped.
2. `trg_auto_upgrade_tier`: Listens to customer point additions and triggers automatic tier promotions.
3. `trg_block_fake_uid`: Prevents counterfeit or non-existent UIDs from entering transaction workflows.
4. `trg_handle_discount_logic`: Validates voucher constraints (minimum spend, usage limits) prior to order commitment.
5. `trg_prevent_expired_delivery`: Blocks packaging or shipping of medicine boxes with less than 30 days of shelf life.
6. `trg_sync_don_hang_to_vanchuyen`: Automatically synchronizes newly confirmed orders into logistics dispatch queues.
7. `trg_tru_ton_kho`: Updates facility stock balances upon completed transfer/inbound operations.
8. `trg_validate_phieu_tra_hang`: Validates RMA return eligibility (purchase date within 30 days, correct order reference).

---

## 🔒 Security & Multi-Tenant Row Level Security (RLS)

- **Dedicated App Role (`00_create_app_user.sql`)**: Isolates web backend connections using least-privilege principles.
- **Row-Level Security (`rls_policies.sql`)**:
  - Enforces facility-level isolation for warehouse staff (users can only access stock and orders belonging to their assigned facility `don_vi_id`).
  - Ensures customer data privacy (customers can only view their own orders, prescriptions, and cart items).
  - Provides administrative bypass tokens for system superusers and background batch workers.

---

## 🚀 Docker Initialization Setup

The master entrypoint file `00_master_init.sql` automatically executes all modules in strict dependency order when the database container initializes:

```sql
-- 1. Security & Roles
\i /docker-entrypoint-initdb.d/security/00_create_app_user.sql

-- 2. Schemas & Tables (01 -> 08)
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

-- 4. Stored Procedures (22 procedures)
\i /docker-entrypoint-initdb.d/procedures/sp_tao_don_hang_tu_gio.sql
...

-- 5. Triggers & Views
\i /docker-entrypoint-initdb.d/triggers/trg_auto_deduct_inventory_from_order.sql
...
\i /docker-entrypoint-initdb.d/views/view_quan_ly_lo_thuoc.sql

-- 6. Row Level Security
\i /docker-entrypoint-initdb.d/security/rls_policies.sql
```
