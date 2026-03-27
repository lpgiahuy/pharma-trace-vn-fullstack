# 🚀 PharmaChain API

<div align="center">
  <p><strong>A robust, production-ready RESTful API for modern pharmaceutical logistics and retail management.</strong></p>
</div>

## 📌 Introduction

PharmaChain API is the core backend service designed to power pharmaceutical supply chain operations, retail management, and logistics. It provides a secure, scalable, and efficient foundation for applications requiring complex inventory tracking, product recalls, and user role management.

**Target Users:** Developers, System Administrators, and Client Applications (Web/Mobile).

### ✨ Key Features
*   **Secure Authentication:** JWT-based user authentication and Role-Based Access Control (RBAC).
*   **Comprehensive Product Management:** Full CRUD operations for products with detailed categorization.
*   **Advanced Logistics Flow:** Real-time inventory tracking and automated recall system handling.
*   **RMA (Return Merchandise Authorization):** Streamlined processing for product returns and refunds.
*   **Interactive Documentation:** Auto-generated API documentation using Swagger (OpenAPI).

## 🏗️ System Architecture

The project follows a standard three-tier architecture model, separating the routing layer, business logic layer, and data access layer.

1.  **Client Application:** Interacts with the API via RESTful HTTP requests.
2.  **Web Server (Node.js & Express):** Handles incoming requests, routing, middleware execution (authentication, validation), and dispatches to controllers.
3.  **Database (PostgreSQL):** Relational database storing all persistent data (Users, Products, Inventory, RMAs).
4.  **Swagger UI:** Dynamically reads the API definitions and provides an interactive UI for developers to test and explore the endpoints directly from the browser.

## 🚀 API Documentation

This project uses Swagger (OpenAPI) for comprehensive and interactive API documentation.

*   **Swagger UI URL:** `http://localhost:3000/api-docs` (when running locally)

### How to use Swagger UI
1.  Start the local server.
2.  Navigate to the Swagger UI URL in your browser.
3.  Click on any endpoint block to expand and view its details (parameters, request body, responses).
4.  Click the **"Try it out"** button to interact with the API directly from the documentation.
5.  *Note: For protected routes, you will need to authenticate first using the "Authorize" button at the top of the page. See the Authentication section below.*

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18 or higher recommended)
*   PostgreSQL (v14 or higher recommended)
*   npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/pharmachain-backend.git
cd pharmachain-backend
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory based on the provided `.env.example` file.

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=pharmachain_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
```

### 4. Run the project locally
```bash
# Run in development mode (with hot-reloading)
npm run dev

# Run in production mode
npm start
```
The API will be available at `http://localhost:3000`.

## 🔑 Authentication

PharmaChain API secures its endpoints using JSON Web Tokens (JWT). Roles are used to restrict access to specific administrative or logistics functionalities.

### JWT Flow
1.  **Login:** The client sends credentials (email and password) to `/api/v1/auth/login`.
2.  **Token Generation:** If successful, the server responds with a signed JWT.
3.  **Authorized Requests:** The client must include this JWT in the `Authorization` header as a Bearer token for all subsequent requests to protected routes.

**Example Request to a Protected Route:**
```bash
curl -X GET 'http://localhost:3000/api/v1/users/me' \
-H 'Authorization: Bearer <YOUR_JWT_TOKEN>'
```

## 📡 API Endpoints

Below is a high-level overview of the key API endpoints. For complete details, payload structures, and response codes, please refer to the [Swagger Documentation](#-api-documentation).

### Authentication (`/api/v1/auth`)
*   `POST /register` - Register a new user
*   `POST /login` - Login and receive a JWT

### User Management (`/api/v1/users`)
*   `GET /me` - Get current authenticated user profile
*   `GET /` - Get all users (Admin only)
*   `PUT /:id/role` - Update user role (Admin only)

### Product Management (`/api/v1/products`)
*   `GET /` - Retrieve all products (supports pagination and filtering)
*   `POST /` - Create a new product (Admin/Manager only)
*   `GET /:id` - Get product details
*   `PUT /:id` - Update a product
*   `DELETE /:id` - Delete a product

### RMA System (`/api/v1/rma`)
*   `POST /` - Initiate a return/refund request
*   `GET /` - View RMA requests
*   `PUT /:id/status` - Update RMA status (Approve/Reject)

### Logistics (`/api/v1/logistics`)
*   `GET /inventory` - Check current stock levels
*   `POST /recall` - Trigger a product recall event

## 📂 Project Structure

```text
pharmachain-backend/
├── src/
│   ├── config/         # Environment variables and configuration files
│   ├── controllers/    # Route controllers (handle request/response logic)
│   ├── middlewares/    # Custom express middlewares (auth, error handling)
│   ├── models/         # Database models (Sequelize/Prisma schemas)
│   ├── routes/         # Express API route definitions
│   ├── services/       # Core business logic separated from controllers
│   ├── utils/          # Utility functions and helpers
│   └── app.js          # Express app setup and configuration
├── .env.example        # Example environment variables
├── package.json        # Project metadata and dependencies
└── README.md           # Project documentation
```

## 🧪 Testing

This project uses Jest and Supertest for unit and integration testing.

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## 🚀 Deployment

The API is ready to be deployed to modern cloud platforms. We recommend using Docker for consistent environments or PaaS providers like Railway or Render.

### Deploying via Docker
1.  Ensure Docker is installed on your host.
2.  Build the Docker image:
    ```bash
    docker build -t pharmachain-api .
    ```
3.  Run the container:
    ```bash
    docker run -p 3000:3000 --env-file .env pharmachain-api
    ```

### Deploying to Render / Railway
1.  Connect your GitHub repository to the platform.
2.  Set the Root Directory (if applicable) and Build Command (`npm install`).
3.  Set the Start Command (`npm start`).
4.  Configure the Environment Variables defined in your `.env` file within the platform's dashboard.

## 🤝 Contributing

We welcome contributions to PharmaChain! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
