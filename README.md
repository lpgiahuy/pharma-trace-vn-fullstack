<div align="center">
  <img src="./src/assets/logo.png" alt="PharmaTrace VN Logo" width="120" style="border-radius: 20px;" />
  <h1>PharmaTrace VN Frontend</h1>
  <p><strong>A Modern, Production-Ready E-Commerce & Supply Chain Platform for Pharmaceuticals</strong></p>
  
  [![React](https://img.shields.io/badge/React-18.x-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg?style=flat&logo=vite)](https://vitejs.dev/)
  [![Zustand](https://img.shields.io/badge/Zustand-4.x-orange.svg?style=flat&logo=react)](https://github.com/pmndrs/zustand)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-0170FE.svg?style=flat&logo=antdesign)](https://ant.design/)
</div>

---

## 📖 Table of Contents
- [📖 Table of Contents](#-table-of-contents)
- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
  - [🛍️ Customer Portal (E-Commerce)](#️-customer-portal-e-commerce)
  - [👨‍💼 Admin Portal (ERP/Backoffice)](#-admin-portal-erpbackoffice)
  - [🏭 Warehouse Portal (WMS)](#-warehouse-portal-wms)
- [💻 Tech Stack](#-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [🔑 Demo Credentials](#-demo-credentials)
- [🔌 Connecting to Backend](#-connecting-to-backend)
- [📜 Available Scripts](#-available-scripts)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Overview
**PharmaTrace VN Frontend** is a multi-portal application designed to handle end-to-end pharmaceutical supply chain operations. It provides a seamless e-commerce experience for customers while offering robust administrative and warehouse management tools for internal staff.

Built with performance and scalability in mind, it utilizes React 18, Vite, and a hybrid styling approach (Tailwind CSS for customer-facing UI, Ant Design for complex admin dashboards).

---

## ✨ Key Features

### 🛍️ Customer Portal (E-Commerce) `(/)`
- **Product Discovery:** Hero banner carousel, categorized grid, and featured products display.
- **Advanced Browsing:** Real-time search, multi-faceted filtering, sorting, and pagination.
- **Product Details:** Tabs for detailed descriptions, specifications, and customer reviews.
- **Shopping Cart:** Quantity control, real-time total calculation, and voucher code validation.
- **Seamless Checkout:** Multi-step checkout with address selection and multiple payment methods.
- **User Dashboard:** Order history tracking, wishlist management, prescription uploads, and Return Merchandise Authorization (RMA) requests.
- **Health Blog:** Health articles list and detailed reading views.

### 👨‍💼 Admin Portal (ERP/Backoffice) `(/admin)`
- **Analytics Dashboard:** Visual revenue charts, order statistics, low-stock alerts, and top-selling product metrics using Recharts.
- **Product Management:** Full CRUD operations with rich-text descriptions and drag-and-drop image uploads.
- **Order Management:** Comprehensive order list, detailed views, and status manipulation.
- **RMA Workflow:** Approval/rejection interface for customer return requests.
- **Marketing:** Voucher/coupon creation (percentage, fixed amount, free shipping).
- **Content Management (CMS):** Create, edit, and publish blog articles.
- **Staff Control:** Role-Based Access Control (RBAC) and employee management.

### 🏭 Warehouse Portal (WMS) `(/warehouse)`
- **Inbound Operations:** Receive stock, auto-generate QR codes and UIDs, and print physical product labels.
- **Fulfillment Pipeline:** Pack confirmed orders and mark them as shipped.
- **Inventory Transfer:** Digitally move stock between different physical locations or shelves.
- **Disposal Tracking:** Record expired or damaged stock with mandatory audit logging.
- **Batch Recalls:** Emergency recall execution with severity classification parameters.
- **Smart Scanner:** Integrated HTML5 camera scanner and manual lookup for rapid inventory checks.

---

## 💻 Tech Stack

| Category        | Technology                                                                 |
|-----------------|----------------------------------------------------------------------------|
| **Core**        | React 18, Vite                                                             |
| **Routing**     | React Router v6                                                            |
| **State Mgmt**  | Zustand (with persistence middleware)                                      |
| **Networking**  | Axios (Configured with JWT interceptors & auto-refresh)                    |
| **UI (Customer)**| Tailwind CSS, Framer Motion, Lucide React                               |
| **UI (Admin)**  | Ant Design v5 (@ant-design/charts, @ant-design/icons)                      |
| **Forms**       | React Hook Form, Zod (Validation schema)                                   |
| **Data Viz**    | Recharts                                                                   |
| **Utilities**   | Day.js (Dates), clsx + tailwind-merge (Classes), jwt-decode, DOMPurify     |
| **Hardware Int.**| qrcode.react (QR Generation), html5-qrcode (Camera scanning)              |
| **Content**     | React Quill (Rich text editor), react-image-gallery, Swiper (Carousel)     |

---

## 📂 Project Structure

```text
src/
├── assets/                  # Static images, global icons and fonts
├── components/
│   ├── ui/                  # Reusable atomic UI: Buttons, Inputs, Modals, Badges, Spinners
│   └── shared/              # Cross-page parts: Header, Footer, Sidebars, CartDrawer
├── config/                  # App configurations: antdTheme.js, env.js
├── constants/               # Global constants: Roles, API endpoints, LocalStorage keys
├── hooks/                   # Custom logic hooks: useAsync, useDebounce, usePermission
├── layouts/                 # Structural layouts: MainLayout, AdminLayout, AuthLayout
├── pages/
│   ├── auth/                # Login, Register, Password Recovery flows
│   ├── ecom/                # Customer facing pages: Home, Cart, Checkout, Account
│   ├── admin/               # ERP pages: Dashboard, Products, Orders, Vouchers
│   └── warehouse/           # WMS pages: Inbound, Fulfillment, Scanner, Recalls
├── routes/                  # Routing logic: AppRoutes, ProtectedRoute, GuestRoute
├── services/                # API communication layers and mock data generators
├── store/                   # Global state slices: authStore, cartStore, uiStore
└── utils/                   # Helper string/number formatting, error parsing
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- npm or yarn or pnpm

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd pharmatrace-vn-frontend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(By default, Mock mode is ON; you do not need the backend running to preview the UI)*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   🚀 Open [http://localhost:5173](http://localhost:5173) (or the port Vite provides) in your browser.

---

## ⚙️ Environment Variables

Adjust the `.env` file based on your environment:

```env
VITE_API_BASE_URL=http://localhost:3002/v1/pharmatrace   # Point to your Node.js Backend
VITE_APP_NAME="PharmaTrace VN"                           # App Name displayed in UI/Title
VITE_APP_VERSION=1.0.0                                   # App version
VITE_REFRESH_TOKEN_THRESHOLD=300000                      # Auto-refresh JWT 5 mins before expiration
```

---

## 🔑 Demo Credentials

Use the following test accounts to explore different portals when logging in:

| Role      | Portal Access | Email                        | Password     |
|-----------|---------------|------------------------------|--------------|
| **Admin** | ERP & WMS     | `admin@pharmatrace.vn`       | `password123`|
| **Staff** | WMS Only      | `warehouse@pharmatrace.vn`   | `password123`|
| **User**  | E-Commerce    | `customer@test.com`          | `password123`|

---

## 🔌 Connecting to Backend

To integrate with the real `pharmatrace_vn_backend` API:

1. Update your `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3002/v1/pharmatrace
   ```
2. The Axios client (`src/services/apiClient.js`) is pre-configured to automatically attach `Authorization: Bearer <token>` to outbound requests.
3. On a `401 Unauthorized` response, the interceptor will automatically attempt to refresh the session seamlessly.

---

## 📜 Available Scripts

- **`npm run dev`**: Starts the Vite development server with Hot Module Replacement (HMR).
- **`npm run build`**: Compiles and minifies the application for production into the `dist/` directory.
- **`npm run preview`**: Boots up a local static web server to preview the production `dist/` build.
- **`npm run lint`**: Runs ESLint to find and optionally fix problems in JavaScript/React code.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
This project is proprietary and confidential. Unauthorized copying of this project, via any medium, is strictly prohibited.
