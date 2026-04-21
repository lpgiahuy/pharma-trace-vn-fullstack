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
| **NhanVienBanHang** | Sales, order management, prescription approval, voucher management, blogs, categories, and RMA/refund processing |

### Rate Limiting

All API endpoints are rate-limited to **100 requests per 15 minutes** per IP address.

---

## 📡 API Reference

**Base URL:** `http://localhost:3002/v1/pharmachain`

All endpoint URLs below are relative to the base URL.

---

<details>
<summary><strong>1. 🔐 Customer Authentication</strong></summary>

### 1. 🔐 Customer Authentication

#### `POST /auth/register`

Register a new customer account.

- **Auth Required:** No


| Field | Type | Required | Description |
|---|---|---|---|
| `ho_ten` | string | ✅ | Full name |
| `so_dien_thoai` | string | ✅ | Phone number (used for login) |
| `email` | string | ❌ | Email address |
| `mat_khau` | string | ✅ | Password |
| `dia_chi` | string | ❌ | Delivery address |


#### `POST /auth/login`

Customer login — returns a JWT token.

- **Auth Required:** No
</details>


---

<details>
<summary><strong>2. 🛍️ Products (Public)</strong></summary>

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
</details>

---

<details>
<summary><strong>3. 🛒 Cart</strong></summary>

### 3. 🛒 Cart

> **All cart endpoints require Customer JWT token.**

#### `GET /cart`

Get the current customer's cart details.


---

#### `POST /cart/add`

Add a product to the shopping cart.


| Field | Type | Required | Description |
|---|---|---|---|
| `duoc_pham_id` | integer | ✅ | Product (medicine) ID |
| `quy_cach_id` | integer | ✅ | Packaging type ID |
| `so_luong` | integer | ✅ | Quantity |
</details>

---

<details>
<summary><strong>4. 📦 Orders</strong></summary>

### 4. 📦 Orders

#### `POST /orders/checkout`

Place an order from the current cart.

- **Auth Required:** Customer JWT

**Request Body:**


| Field | Type | Required | Description |
|---|---|---|---|
| `dia_chi_giao_hang` | string | ✅ | Delivery address |
| `phuong_thuc_thanh_toan` | string | ✅ | Payment method: `COD`, `VNPAY`, `MOMO` |
| `ghi_chu` | string | ❌ | Note for shipper |
| `voucher_id` | integer | ❌ | Voucher ID for discount |
</details>

---

<details>
<summary><strong>5. ⭐ Reviews</strong></summary>

### 5. ⭐ Reviews

#### `GET /reviews/product/:productId`

Get reviews for a specific product.

- **Auth Required:** No



---

#### `POST /reviews/add`

Submit a product review (one review per product per customer).

- **Auth Required:** Customer JWT
</details>


---

<details>
<summary><strong>6. 💝 Wishlist</strong></summary>

### 6. 💝 Wishlist

> **All wishlist endpoints require Customer JWT token.**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/wishlist` | Get my wishlist |
| `POST` | `/wishlist/add` | Add product to wishlist |
| `DELETE` | `/wishlist/remove/:productId` | Remove product from wishlist |
</details>


---

<details>
<summary><strong>7. 🎟️ Vouchers (Customer)</strong></summary>

### 7. 🎟️ Vouchers (Customer)

#### `POST /vouchers/apply`

Apply a voucher code to the order.

- **Auth Required:** Customer JWT
</details>


---

<details>
<summary><strong>8. 📋 Prescriptions (Customer)</strong></summary>

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
</details>


---

<details>
<summary><strong>9. 🔄 RMA — Returns (Customer)</strong></summary>

### 9. 🔄 RMA — Returns (Customer)

#### `POST /rma/request`

Submit a return/refund request (order must be in "Delivered" status).

- **Auth Required:** Customer JWT


**Responses:**

| Status | Description |
|---|---|
| `201` | Return request submitted successfully |
| `400` | Order not eligible or missing data |
| `403` | Attempting to return another user's order |
| `404` | Order not found |
</details>

---

<details>
<summary><strong>10. 🔍 Traceability (QR Scan)</strong></summary>

### 10. 🔍 Traceability (QR Scan)

#### `POST /trace/scan-qr`

Scan a QR code to trace a medicine box's full journey.

- **Auth Required:** JWT (any role)


**Returns:** Batch info, manufacturer, expiry date, and full warehouse movement history.
</details>

---

<details>
<summary><strong>11. 🏢 Admin Authentication</strong></summary>

### 11. 🏢 Admin Authentication

#### `POST /admin/auth/login`

Admin/Staff login.

- **Auth Required:** No

---

#### `POST /admin/auth/setup`

Initialize the first SuperAdmin account (first-time deployment only).

- **Auth Required:** No
</details>

---

<details>
<summary><strong>12. 📦 Admin — Product Management</strong></summary>

### 12. 📦 Admin — Product Management

> **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/products` | List all products (including inactive) |
| `GET` | `/admin/products/:id` | Get product detail with packaging options |
| `POST` | `/admin/products/add` | Create a new product |
| `PUT` | `/admin/products/:id` | Update product & packaging units |
| `DELETE` | `/admin/products/:id` | Soft delete (set inactive) |
</details>


---

<details>
<summary><strong>13. 📋 Admin — Order Management</strong></summary>

### 13. 📋 Admin — Order Management

> **Auth Required:** JWT with `SuperAdmin`, `NhanVienBanHang`, or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/orders` | List all orders |
| `GET` | `/admin/orders/:id` | Get order detail with line items |
| `POST` | `/admin/orders/:id/fulfill` | Fulfill order by assigning scanned UIDs |
</details>


---

<details>
<summary><strong>14. 💊 Admin — Prescription Management</strong></summary>

### 14. 💊 Admin — Prescription Management

> **Auth Required:** JWT with `SuperAdmin` or `NhanVienBanHang` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/prescriptions` | List prescriptions (filter by `?status=ChoDuyet\|HopLe\|TuChoi`) |
| `PUT` | `/admin/prescriptions/:id/status` | Approve or reject a prescription |
</details>


---

<details>
<summary><strong>15. 👥 Admin — Staff Management</strong></summary>

### 15. 👥 Admin — Staff Management

> **Auth Required:** JWT with `SuperAdmin` role only.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/staff` | List all staff members |
| `POST` | `/admin/staff/add` | Create a new staff account |
| `PUT` | `/admin/staff/:id` | Update staff info/role |
| `DELETE` | `/admin/staff/:id` | Disable staff account (soft delete) |


Available roles: `SuperAdmin`, `QuanLyKho`, `NhanVienBanHang`
</details>

---

<details>
<summary><strong>16. 🎟️ Admin — Voucher Management</strong></summary>

### 16. 🎟️ Admin — Voucher Management

> **Auth Required:** JWT with `SuperAdmin` or `NhanVienBanHang` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/vouchers` | List all vouchers |
| `POST` | `/admin/vouchers/add` | Create a new voucher |
| `DELETE` | `/admin/vouchers/:id` | Delete a voucher (hard delete) |
</details>


---

<details>
<summary><strong>17. 📂 Admin — Category Management</strong></summary>

### 17. 📂 Admin — Category Management

> **Auth Required:** JWT with `SuperAdmin` or `NhanVienBanHang` role (except public endpoint).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/categories/public` | ❌ None | Get active categories (public) |
| `GET` | `/admin/categories` | ✅ Admin | Get all categories (including hidden) |
| `POST` | `/admin/categories/add` | ✅ Admin | Create a category |
| `PUT` | `/admin/categories/:id` | ✅ Admin | Update a category |
| `DELETE` | `/admin/categories/:id` | ✅ Admin | Soft delete (hide from customers) |
</details>

---

<details>
<summary><strong>18. 📝 Admin — Blog Management</strong></summary>

### 18. 📝 Admin — Blog Management

> **Auth Required:** JWT with `SuperAdmin` or `NhanVienBanHang` role (except public endpoints).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/blogs/public` | ❌ None | Get published blog posts |
| `GET` | `/admin/blogs/public/:id` | ❌ None | Get blog post detail |
| `POST` | `/admin/blogs/add` | ✅ Admin | Create a blog post |
| `PUT` | `/admin/blogs/:id` | ✅ Admin | Update a blog post |
| `DELETE` | `/admin/blogs/:id` | ✅ Admin | Delete a blog post (hard delete) |
</details>

---

<details>
<summary><strong>19. 🔄 Admin — RMA Management</strong></summary>

### 19. 🔄 Admin — RMA Management

> **Auth Required:** JWT with `SuperAdmin` or `NhanVienBanHang` role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/rma` | List all return requests |
| `PUT` | `/admin/rma/:id/status` | Approve (`DaHoanTien`) or reject (`TuChoi`) |
</details>

---

<details>
<summary><strong>20. 🏭 Inventory Management</strong></summary>

### 20. 🏭 Inventory Management

#### `POST /inventory/nhap-kho`

Import a new medicine batch from supplier into warehouse inventory.

- **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role
</details>


---

<details>
<summary><strong>21. 📊 Dashboard</strong></summary>

### 21. 📊 Dashboard

#### `GET /dashboard`

Get comprehensive admin dashboard data.

- **Auth Required:** JWT with `SuperAdmin` role only
</details>


---

<details>
<summary><strong>22. 🚚 Logistics</strong></summary>

### 22. 🚚 Logistics

> **Auth Required:** JWT with `SuperAdmin` or `QuanLyKho` role.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/logistics/transfer` | Transfer medicine boxes between warehouses |
| `POST` | `/logistics/dispose` | Dispose of damaged/expired boxes |
| `POST` | `/logistics/return` | Process customer return to warehouse |
| `POST` | `/logistics/recall/:loThuocId` | Emergency batch recall |
</details>


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
