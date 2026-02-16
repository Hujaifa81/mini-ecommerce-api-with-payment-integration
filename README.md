# Mini E-Commerce API - AppifyDevs Backend Assignment

A comprehensive and secure backend system for a mini e-commerce platform. Built with a focus on **data integrity**, **fraud prevention**, and **production-grade architecture**.

## 🚀 Quick Links
- **Live API Base URL**: `https://mini-ecommerce-api-with-payment.onrender.com`
- **Postman Collection**: [mini-ecommerce.postman_collection.json](./mini-ecommerce.postman_collection.json)
- **Detailed ER Diagram**: [View ERD.md](./ERD.md)

---

## API Route Format


All API endpoints follow this base structure:

`https://mini-ecommerce-api-with-payment.onrender.com/api/v1/<resource>`

For example:
Product Routes:
https://mini-ecommerce-api-with-payment.onrender.com/api/v1/product

---

## 🔐 Test Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |
| **Customer** | `customer@example.com` | `customer123` |

---

> [!IMPORTANT]
> This project implements a sophisticated **Fraud Prevention Layer** to protect inventory from "Stock Jailing" attacks, exceeding the basic assignment requirements.

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Registration & Login**: JWT-based authentication with `accessToken` and `refreshToken` support.
- **Role-Based Access Control (RBAC)**: Strict separation between `ADMIN` and `CUSTOMER` permissions.
- **Brute-Force Protection**: Rate-limiting on authentication endpoints to prevent credential stuffing.

### 📦 Product Management (Admin Only)
- **Full CRUD**: Admins can create, read, update, and delete products.
- **Inventory Control**: Precise stock management with built-in validation to prevent negative inventory.
- **Transactional Updates**: Product data changes are handled atomically.

## 📝 Assumptions Made
1.  **Payment Window**: Orders are assumed "abandoned" if payment isn't finalized within **30 minutes**, after which inventory is returned to the store.
2.  **Rate Limiting Policy**: The anti-abuse limits (5 pending orders / 3 cancellations) are considered optimal for a balance between UX and fraud prevention.
3.  **Price Locking**: It is assumed that once an order is created, the price is locked, regardless of future product price changes.
4.  **Single Currency**: The system assumes operations in a single currency (USD) for both catalog and payment processing.
5.  **Stateless sessions**: The system assumes clients handle JWT tokens appropriately for authentication.

### 🛍️ Customer Features
- **Smart Cart Ops**: Add/Remove items with real-time stock availability checks.
- **Order Placement**: Multi-step order lifecycle (Creation -> Payment -> Fulfillment).
- **Personal Dashboard**: Customers can track their own order history and status.

---

## 🛡️ Anti-Fraud & Business Logic

The system is designed to prevent "Stock Jailing" (malicious actors locking up inventory without paying):

1.  **Pending Order Cap**: Users are limited to **5 concurrent PENDING orders**. They must pay or wait for expiry before creating more.
2.  **Daily Cancellation Limit**: Customers are allowed only **3 cancellations per day** to prevent automated inventory harassment.
3.  **Automatic Stock Recovery**: A background worker (`node-cron`) identifies unpaid orders older than **30 minutes**, cancels them, and automatically restores stock to the catalog.
4.  **Backend Authority**: All price calculations and totals are performed on the server inside DB transactions to prevent client-side manipulation.
5.  **Pessimistic Locking**: Uses `SELECT ... FOR UPDATE` during order creation to prevent race conditions during high-traffic sales.

---

## 🎁 Bonus Features Implemented
- **Payment Integration**: Full Stripe Checkout integration with secure Redirect flow.
- **Webhook Security**: Cryptographic signature verification and **Idempotency** for Stripe events.
- **Order Lifecycle**: Automated transitions through `PENDING` -> `SHIPPED` -> `DELIVERED` states.
- **Database Transactions**: 100% of critical operations use `prisma.$transaction`.

---

## 📁 Database Schema

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--|| CART : owns
    PRODUCT ||--o{ CART_ITEM : "added to"
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    CART ||--o{ CART_ITEM : contains
    ORDER ||--o{ ORDER_ITEM : details
    ORDER ||--|| PAYMENT : "processed via"
```

---

## 🧰 Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Language** | TypeScript (ES2023) |
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Payments** | Stripe |
| **Validation** | Zod |
| **Worker** | node-cron |

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Stripe Account (for API keys)

### 2. Installation
```bash
# Clone the repository
git clone <https://github.com/Hujaifa81/mini-ecommerce-api-with-payment-integration>
cd mini-ecommerce-with-payment-integration-backend

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Server
PORT=5000
NODE_ENV="development"
WHITE_LIST_ORIGIN="http://localhost:3000"
EXPRESS_SESSION_SECRET="your_session_secret"

# Auth
JWT_ACCESS_SECRET="your_access_secret"
JWT_ACCESS_EXPIRES="7d"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_REFRESH_EXPIRES="30d"
BCRYPT_SALT_ROUNDS=10

# Frontend
FRONTEND_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_CURRENCY="usd"
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Database Initialization
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Running the App
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

---

## 📝 Key Architectural Decisions
- **Modularity**: The project uses a file-based Prisma schema architecture for better maintainability.
- **Non-blocking Payments**: Stripe sessions are created *after* the database commit to prevent hanging DB connections.
- **Error Handling**: Centralized `ApiError` class ensures consistent JSON error responses across the entire system.

---
*Developed by Hujaifa (@Hujaifa81) for the AppifyDevs technical assessment.*
