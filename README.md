# 💊 PharmaChain Backend API

<div align="center">
  <p><strong>An Integrated System for Pharmaceutical Sales Management, Supply Chain Transparency, and Drug Authentication</strong></p>

  ![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
</div>

---

## 📌 Introduction

PharmaChain Backend API is a production-ready RESTful service built with **Node.js** and **Express 5**. It powers the entire pharmaceutical e-commerce and supply chain management platform — from customer shopping and order processing to warehouse logistics, drug traceability, and administrative operations.

### Key Capabilities

| Feature | Description |
|---|---|
| **JWT Authentication** | Secure token-based auth with Role-Based Access Control (RBAC) |
| **E-commerce** | Products, cart, checkout, reviews, wishlist, vouchers |
| **Prescription Management** | Upload, review, and approve prescription images |
| **Supply Chain Traceability** | QR-based tracking for every medicine box from factory to customer |
| **Warehouse Logistics** | Stock import, inter-warehouse transfer, disposal, batch recall |
| **RMA Processing** | Customer return/refund request workflow |
| **Admin Dashboard** | Revenue analytics, expiry alerts, counterfeit heatmap |
| **Swagger UI** | Interactive API documentation at `/api-docs` |

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone https://github.com/huyle44/PharmaChain_BackEnd.git
cd PharmaChain_BackEnd
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3002
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pharmachain_db

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Swagger UI Protection
SWAGGER_USER=admin
SWAGGER_PASS=your_swagger_password

# Frontend URL (for CORS in production)
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Run the Server

```bash
# Development (hot-reload with Nodemon)
npm run dev

# The API will be available at:
# http://localhost:3002/v1/pharmachain
```

### 4. Access Swagger Docs

Navigate to `http://localhost:3002/api-docs` and enter the Basic Auth credentials configured in `.env`.

---

## 🔑 Authentication

All protected endpoints require a **JWT Bearer Token** in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

| Role | Access Level |
|---|---|
| **Customer** | E-commerce features (cart, orders, reviews, wishlist, prescriptions, RMA) |
| **SuperAdmin** | Full system access |
| **QuanLyKho** | Warehouse & inventory management |
| **NhanVienBanHang** | Sales & POS, order management, prescription review and approval, voucher management, blog, category management, RMA/refund processing |
| **DuocSi** | Prescription review & approval |
| **KeToan** | RMA/refund processing |

### Rate Limiting

All API endpoints are rate-limited to **100 requests per 15 minutes** per IP address.

---

## 📡 API Reference

**Base URL:** `http://localhost:3002/v1/pharmachain`

All endpoint URLs below are relative to the base URL.

---

### 1. 🔐 Customer Authentication

#### `POST /auth/register`

Register a new customer account.

- **Auth Required:** No

**Request Body:**

```json
{
  "ho_ten": "Nguyễn Văn A",
  "so_dien_thoai": "0901234567",
  "email": "nguyenvana@gmail.com",
  "mat_khau": "Password123",
  "dia_chi": "123 ABC Street, District 1, Ho Chi Minh City"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `ho_ten` | string | ✅ | Full name |
| `so_dien_thoai` | string | ✅ | Phone number (used for login) |
| `email` | string | ❌ | Email address |
| `mat_khau` | string | ✅ | Password |
| `dia_chi` | string | ❌ | Delivery address |

**Responses:**

| Status | Description |
|---|---|
| `201` | Account registered successfully |
| `400` | Phone number or email already exists |

---

#### `POST /auth/login`

Customer login — returns a JWT token.

- **Auth Required:** No

**Request Body:**

```json
{
  "so_dien_thoai": "0901234567",
  "mat_khau": "Password123"
}
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "ho_ten": "Nguyễn Văn A",
      "so_dien_thoai": "0901234567"
    }
  }
}
```

---

### 2. 🛍️ Products (Public)

#### `GET /products`

Get product list with pagination, filtering, and search.

- **Auth Required:** No

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Products per page |
| `category` | integer | — | Filter by category ID |
| `search` | string | — | Search by product name |
| `sort` | string | — | Sort: `price_asc`, `price_desc`, `newest` |

**Example:**

```bash
curl -X GET 'http://localhost:3002/v1/pharmachain/products?page=1&limit=10&search=paracetamol&sort=price_asc'
```

---

#### `GET /products/categories`

Get all active product categories.

- **Auth Required:** No

---

#### `GET /products/:id`

Get detailed product information by ID or slug.

- **Auth Required:** No

| Parameter | In | Type | Description |
|---|---|---|---|
| `id` | path | string | Product ID or slug |

---

### 3. 🛒 Cart

> **All cart endpoints require Customer JWT token.**

#### `GET /cart`

Get the current customer's cart details.

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "duoc_pham_id": 15,
        "ten_thuoc": "Paracetamol 500mg",
        "quy_cach_id": 3,
        "so_luong": 2,
        "gia_ban": 5000
      }
    ]
  }
}
```

---

#### `POST /cart/add`

Add a product to the shopping cart.

**Request Body:**

```json
{
  "duoc_pham_id": 15,
  "quy_cach_id": 3,
  "so_luong": 2
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `duoc_pham_id` | integer | ✅ | Product (medicine) ID |
| `quy_cach_id` | integer | ✅ | Packaging type ID |
| `so_luong` | integer | ✅ | Quantity |

---

### 4. 📦 Orders

#### `POST /orders/checkout`

Place an order from the current cart.

- **Auth Required:** Customer JWT

**Request Body:**

```json
{
  "dia_chi_giao_hang": "123 Nguyen Hue Street, District 1, HCMC",
  "phuong_thuc_thanh_toan": "COD",
  "ghi_chu": "Please deliver during business hours",
  "voucher_id": 5
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dia_chi_giao_hang` | string | ✅ | Delivery address |
| `phuong_thuc_thanh_toan` | string | ✅ | Payment method: `COD`, `VNPAY`, `MOMO` |
| `ghi_chu` | string | ❌ | Note for shipper |
| `voucher_id` | integer | ❌ | Voucher ID for discount |

---

### 5. ⭐ Reviews

#### `GET /reviews/product/:productId`

Get reviews for a specific product.

- **Auth Required:** No

**Example Response (200):**

```json
{
  "success": true,
  "total_reviews": 2,
  "data": [
    {
      "id": 1,
      "so_sao": 5,
      "noi_dung": "Great product, fast delivery!",
      "ngay_danh_gia": "2024-03-24T10:00:00.000Z",
      "ten_khach_hang": "Nguyễn Văn A"
    }
  ]
}
```

---

#### `POST /reviews/add`

Submit a product review (one review per product per customer).

- **Auth Required:** Customer JWT

**Request Body:**

```json
{
  "duoc_pham_id": 15,
  "so_sao": 5,
  "noi_dung": "Genuine medicine, well-packaged."
}
```

---

### 6. 💝 Wishlist

> **All wishlist endpoints require Customer JWT token.**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/wishlist` | Get my wishlist |
| `POST` | `/wishlist/add` | Add product to wishlist |
| `DELETE` | `/wishlist/remove/:productId` | Remove product from wishlist |

**Add to Wishlist — Request Body:**

```json
{
  "duoc_pham_id": 15
}
```

---

### 7. 🎟️ Vouchers (Customer)

#### `POST /vouchers/apply`

Apply a voucher code to the order.

- **Auth Required:** Customer JWT

**Request Body:**

```json
{
  "ma_code": "WELCOME2024",
  "tong_tien_don_hang": 250000
}
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Voucher applied successfully!",
  "data": {
    "ma_code": "WELCOME2024",
    "loai_giam_gia": "PhanTram",
    "so_tien_giam": 25000
  }
}
```

---

### 8. 📋 Prescriptions (Customer)

#### `POST /prescriptions/upload`

Upload a prescription image for pharmacist review.

- **Auth Required:** Customer JWT
- **Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `hinh_anh` | file | ✅ | Prescription image (jpg, png) |
| `ten_bac_si` | string | ❌ | Doctor name |
| `ten_benh_vien` | string | ❌ | Hospital name |
| `chuan_doan` | string | ❌ | Diagnosis |

**Example Response (201):**

```json
{
  "success": true,
  "message": "Prescription uploaded successfully! Please wait for pharmacist review.",
  "data": {
    "id": 1,
    "hinh_anh_toa": "/uploads/1711440000000-prescription.jpg",
    "trang_thai_duyet": "ChoDuyet"
  }
}
```

---

### 9. 🔄 RMA — Returns (Customer)

#### `POST /rma/request`

Submit a return/refund request (order must be in "Delivered" status).

- **Auth Required:** Customer JWT

**Request Body:**

```json
{
  "don_hang_id": 101,
  "ly_do_tra": "Product was damaged during shipping."
}
```

**Responses:**

| Status | Description |
|---|---|
| `201` | Return request submitted successfully |
| `400` | Order not eligible or missing data |
| `403` | Attempting to return another user's order |
| `404` | Order not found |

---

### 10. 🔍 Traceability (QR Scan)

#### `POST /trace/scan-qr`

Scan a QR code to trace a medicine box's full journey.

- **Auth Required:** JWT (any role)

**Request Body:**

```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Returns:** Batch info, manufacturer, expiry date, and full warehouse movement history.

---

### 11. 🏢 Admin Authentication

#### `POST /admin/auth/login`

Admin/Staff login.

- **Auth Required:** No

**Request Body:**

```json
{
  "email": "admin@pharmachain.vn",
  "password": "123456"
}
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Admin login successful!",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": 1,
      "ho_ten": "Admin",
      "vai_tro": "SuperAdmin"
    }
  }
}
```

---

#### `POST /admin/auth/setup`

Initialize the first SuperAdmin account (first-time deployment only).

- **Auth Required:** No

**Request Body:**

```json
{
  "ho_ten": "Admin",
  "email": "admin@pharmachain.vn",
  "password": "123456",
  "don_vi_id": 1
}
```

---

### 12. 📦 Admin — Product Management

> **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/products` | List all products (including inactive) |
| `GET` | `/admin/products/:id` | Get product detail with packaging options |
| `POST` | `/admin/products/add` | Create a new product |
| `PUT` | `/admin/products/:id` | Update product & packaging units |
| `DELETE` | `/admin/products/:id` | Soft delete (set inactive) |

**Create Product — Request Body:**

```json
{
  "thong_tin_thuoc": {
    "ten_thuoc": "Paracetamol 500mg",
    "so_dang_ky": "VD-12345-22",
    "danh_muc_id": 1,
    "don_vi_san_xuat_id": 5,
    "hinh_anh_url": "https://image.com/pax.jpg",
    "la_thuoc_ke_don": false,
    "mo_ta_ngan": "Pain relief, fever reduction",
    "chi_tiet_thuoc": {
      "thanh_phan": "Paracetamol",
      "chong_chi_dinh": "Do not use if allergic..."
    }
  },
  "quy_cach_dong_goi": [
    {
      "ten_don_vi": "Tablet",
      "he_so_quy_doi": 1,
      "gia_ban": 1000,
      "la_don_vi_co_ban": true
    }
  ]
}
```

---

### 13. 📋 Admin — Order Management

> **Auth Required:** JWT with `SuperAdmin`, `BanHang`, or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/orders` | List all orders |
| `GET` | `/admin/orders/:id` | Get order detail with line items |
| `POST` | `/admin/orders/:id/fulfill` | Fulfill order by assigning scanned UIDs |

**Fulfill Order — Request Body:**

```json
{
  "mang_uid": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

### 14. 💊 Admin — Prescription Management

> **Auth Required:** JWT with `SuperAdmin`, `DuocSi`, or `BanHang` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/prescriptions` | List prescriptions (filter by `?status=ChoDuyet\|HopLe\|TuChoi`) |
| `PUT` | `/admin/prescriptions/:id/status` | Approve or reject a prescription |

**Update Status — Request Body:**

```json
{
  "trang_thai_duyet": "HopLe"
}
```

---

### 15. 👥 Admin — Staff Management

> **Auth Required:** JWT with `SuperAdmin` role only.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/staff` | List all staff members |
| `POST` | `/admin/staff/add` | Create a new staff account |
| `PUT` | `/admin/staff/:id` | Update staff info/role |
| `DELETE` | `/admin/staff/:id` | Disable staff account (soft delete) |

**Create Staff — Request Body:**

```json
{
  "don_vi_id": 2,
  "ho_ten": "Trần Thị B",
  "email": "ttb@pharmachain.vn",
  "password": "SecurePassword123!",
  "vai_tro": "BanHang"
}
```

Available roles: `SuperAdmin`, `QuanLyKho`, `BanHang`, `KeToan`, `DuocSi`

---

### 16. 🎟️ Admin — Voucher Management

> **Auth Required:** JWT with `SuperAdmin` or `BanHang` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/vouchers` | List all vouchers |
| `POST` | `/admin/vouchers/add` | Create a new voucher |
| `DELETE` | `/admin/vouchers/:id` | Delete a voucher (hard delete) |

**Create Voucher — Request Body:**

```json
{
  "ma_code": "SUMMER50K",
  "loai_giam_gia": "TienMat",
  "gia_tri": 50000,
  "don_hang_toi_thieu": 300000,
  "ngay_bat_dau": "2025-06-01T00:00:00Z",
  "ngay_ket_thuc": "2030-06-30T23:59:59Z",
  "so_luong_gioi_han": 100
}
```

---

### 17. 📂 Admin — Category Management

> **Auth Required:** JWT with `SuperAdmin` or `BanHang` role (except public endpoint).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/categories/public` | ❌ None | Get active categories (public) |
| `GET` | `/admin/categories` | ✅ Admin | Get all categories (including hidden) |
| `POST` | `/admin/categories/add` | ✅ Admin | Create a category |
| `PUT` | `/admin/categories/:id` | ✅ Admin | Update a category |
| `DELETE` | `/admin/categories/:id` | ✅ Admin | Soft delete (hide from customers) |

---

### 18. 📝 Admin — Blog Management

> **Auth Required:** JWT with `SuperAdmin` or `BanHang` role (except public endpoints).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/blogs/public` | ❌ None | Get published blog posts |
| `GET` | `/admin/blogs/public/:id` | ❌ None | Get blog post detail |
| `POST` | `/admin/blogs/add` | ✅ Admin | Create a blog post |
| `PUT` | `/admin/blogs/:id` | ✅ Admin | Update a blog post |
| `DELETE` | `/admin/blogs/:id` | ✅ Admin | Delete a blog post (hard delete) |

---

### 19. 🔄 Admin — RMA Management

> **Auth Required:** JWT with `SuperAdmin`, `BanHang`, or `KeToan` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/rma` | List all return requests |
| `PUT` | `/admin/rma/:id/status` | Approve (`DaHoanTien`) or reject (`TuChoi`) |

---

### 20. 🏭 Inventory Management

#### `POST /inventory/nhap-kho`

Import a new medicine batch from supplier into warehouse inventory.

- **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role

**Request Body:**

```json
{
  "duoc_pham_id": 1,
  "don_vi_id": 1,
  "so_lo": "BATCH-2026-VIP",
  "ngay_sx": "2026-03-01",
  "hsd": "2030-03-01",
  "so_luong_hop": 100
}
```

---

### 21. 📊 Dashboard

#### `GET /dashboard`

Get comprehensive admin dashboard data.

- **Auth Required:** JWT with `SuperAdmin` role only

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "heatmap_diem_nong": [
      { "toa_do_lat": 10.762622, "toa_do_lng": 106.660172, "so_luong_quet": 5 }
    ],
    "thuoc_can_date": [
      { "ten_thuoc": "Vitamin C 1000mg", "han_su_dung": "2024-05-20" }
    ],
    "bieu_do_doanh_thu": [
      { "ngay": "2024-03-24", "tong_doanh_thu": 15000000 }
    ],
    "tong_quan_kho": [
      { "ten_don_vi": "Southern Main Warehouse", "tong_san_pham": 15200 }
    ]
  }
}
```

---

### 22. 🚚 Logistics

> **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/logistics/transfer` | Transfer medicine boxes between warehouses |
| `POST` | `/logistics/dispose` | Dispose of damaged/expired boxes |
| `POST` | `/logistics/return` | Process customer return to warehouse |
| `POST` | `/logistics/recall/:loThuocId` | Emergency batch recall |

**Transfer — Request Body:**

```json
{
  "tu_don_vi_id": 1,
  "den_don_vi_id": 2,
  "mang_uid": ["uid-1", "uid-2"]
}
```

**Dispose — Request Body:**

```json
{
  "don_vi_id": 1,
  "mang_uid": ["uid-3"],
  "ly_do": "Box damaged during transportation"
}
```

**Return — Request Body:**

```json
{
  "don_hang_id": 105,
  "don_vi_nhan_id": 1,
  "mang_uid": ["uid-1"]
}
```

---

## 📂 Project Structure

```
PharmaChain_BackEnd/
├── server.js               # Application entry point
├── package.json
├── .env                    # Environment variables (not committed)
├── uploads/                # Uploaded files (prescriptions, etc.)
└── src/
    ├── config/
    │   ├── db.js           # PostgreSQL connection pool
    │   └── swagger.js      # Swagger/OpenAPI configuration
    ├── controllers/
    │   ├── admin/          # Admin controllers
    │   ├── ecom/           # E-commerce controllers
    │   └── pharma/         # Pharma/logistics controllers
    ├── middlewares/
    │   ├── authMiddleware.js      # JWT verification
    │   ├── roleMiddleware.js      # Role-based access control
    │   ├── uploadMiddleware.js    # Multer file upload
    │   └── errorMiddleware.js     # Error handling
    ├── models/
    │   ├── admin/          # Admin data models
    │   ├── ecom/           # E-commerce data models
    │   └── pharma/         # Pharma data models
    ├── routes/
    │   ├── index.js        # Root router (mounts all sub-routers)
    │   ├── admin/          # Admin route definitions
    │   ├── ecom/           # E-commerce route definitions
    │   └── pharma/         # Pharma route definitions
    ├── services/
    │   ├── admin/          # Admin business logic
    │   ├── ecom/           # E-commerce business logic
    │   └── pharma/         # Pharma business logic
    └── utils/
        ├── cronJobs.js     # Scheduled tasks
        ├── hashHelper.js   # Password hashing utilities
        └── jwtHelper.js    # JWT generation utilities
```

---

## 🛡️ Security Features

- **Helmet.js** — Hides Express fingerprint and adds security headers
- **CORS** — Configurable origin whitelist (strict in production)
- **Rate Limiting** — 100 requests / 15 minutes per IP
- **JWT Authentication** — Stateless, signed tokens with configurable expiration
- **RBAC** — Granular role-based access control on every protected route
- **Input Size Limit** — JSON body capped at 10KB to prevent memory overflow attacks
- **Swagger Auth** — API docs protected with Basic Authentication in production

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
