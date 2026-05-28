# 💊 PharmaTrace VN Backend API

<div align="center">
  <p><strong>An Integrated System for Pharmaceutical Sales Management, Supply Chain Transparency, and Drug Authentication</strong></p>

  ![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
</div>

---

## 📌 Introduction

PharmaTrace VN Backend API is a production-ready RESTful service built with **Node.js** and **Express 5**. It powers the entire pharmaceutical e-commerce and supply chain management platform — from customer shopping and order processing to warehouse logistics, drug traceability, and administrative operations.

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
git clone https://github.com/huyle44/PharmaTrace_VN_BackEnd.git
cd PharmaTrace_VN_BackEnd
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
DB_NAME=pharmatrace_vn_db

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Swagger UI Protection
SWAGGER_USER=admin
SWAGGER_PASS=your_swagger_password

# Frontend URL (for CORS in production)
FRONTEND_URL=https://your-frontend-domain.com
FRONTEND_URL_2=                              # Optional backup origin

# AI Integration (Google Gemini)
API_GEMINI=your_gemini_api_key
```

### 3. Run the Server

```bash
# Development (hot-reload with Nodemon)
npm run dev

# The API will be available at:
# http://localhost:3002/v1/pharmatrace
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

| Limiter | Applies To | Limit |
|---|---|---|
| **General API** | All `/v1/pharmatrace` endpoints | 1000 requests / 15 minutes / IP |
| **Auth** | `/auth/login`, `/auth/register` | 15 requests / 15 minutes / IP |
| **Checkout** | `/orders/checkout` | 10 requests / 15 minutes / IP |

---

## 📡 API Reference

**Base URL:** `http://localhost:3002/v1/pharmatrace`

The full, interactive API documentation is available via **Swagger UI** once the server is running:

```
http://localhost:3002/api-docs
```

> Access requires Basic Auth credentials configured in your `.env` (`SWAGGER_USER` / `SWAGGER_PASS`).

### API Groups Overview

| Group | Prefix | Description |
|---|---|---|
| **E-commerce — Auth** | `/auth` | Customer register, login, logout, profile, loyalty |
| **E-commerce — Shop** | `/products`, `/cart`, `/orders` | Catalog, cart, checkout, order history |
| **E-commerce — Account** | `/prescriptions`, `/reviews`, `/wishlist`, `/rma` | Prescriptions, reviews, wishlist, returns |
| **E-commerce — Content** | `/blogs`, `/vouchers`, `/chatbot` | Blog, voucher apply, AI chatbot |
| **Admin — Auth** | `/admin/auth` | Admin/staff login, first-time setup |
| **Admin — Management** | `/admin/products`, `/admin/orders`, `/admin/customers` | Product, order, customer CRUD |
| **Admin — Operations** | `/admin/prescriptions`, `/admin/staff`, `/admin/vouchers` | Prescriptions, staff, vouchers |
| **Admin — Content** | `/admin/categories`, `/admin/blogs`, `/admin/rma` | Categories, blog, RMA approval |
| **Warehouse — Inventory** | `/inventory`, `/logistics`, `/kien-hang` | Stock import, transfer, disposal, recall, bundles |
| **Warehouse — Dashboard** | `/dashboard` | Analytics, revenue, low-stock alerts |
| **Traceability** | `/trace` | QR scan — unit-level supply chain history |


---

## 📂 Project Structure

```
PharmaTrace_VN_BackEnd/
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
- **Rate Limiting** — 1000 requests / 15 minutes per IP (stricter limits on auth and checkout endpoints)
- **JWT Authentication** — Stateless, signed tokens with configurable expiration
- **RBAC** — Granular role-based access control on every protected route
- **Input Size Limit** — JSON body capped at 50MB (supports blog posts with Base64-encoded images)
- **Swagger Auth** — API docs protected with Basic Authentication in production

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
