# 🛒 Pasaria - Indonesian Online Marketplace

<p align="center">
  <img src="overview.png" alt="Pasaria Overview" width="100%" />
</p>

<p align="center">
  <strong>A Modern Full-Stack E-Commerce Platform built with a Modular Monolith Architecture, Real-Time Inventory Reservation, and a Full Order Lifecycle State Machine.</strong>
</p>

<p align="center">
  <a href="https://pasaria-e-commerce.vercel.app/">🌐 <strong>Live Demo</strong></a> •
  <a href="https://github.com/AhmadBayu1412/Pasaria-E-Commerce">📦 <strong>GitHub Repository</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5.x-green?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## 📌 Table of Contents

- [About Pasaria](#-about-pasaria)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Order Lifecycle & State Machine](#-order-lifecycle--state-machine)
- [Key API Endpoints](#-key-api-endpoints)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Deployment](#-deployment)
- [AI-Assisted Engineering Workflow](#-ai-assisted-engineering-workflow)
- [License](#-license)

---

## 🌟 About Pasaria

**Pasaria** is an enterprise-grade, end-to-end e-commerce solution engineered to deliver a fast, reliable, and responsive online shopping experience. Designed with a **Modular Monolith** backend architecture in Node.js/Express + TypeScript and a modern frontend powered by **Next.js App Router** and **Tailwind CSS v4**, Pasaria is built to handle real-world e-commerce flows—from atomic stock reservation and multi-step checkouts to idempotent payment webhook processing and asynchronous background jobs.

---

## ✨ Key Features

### 🛍️ Customer Experience
- **Dynamic Catalog & Category Browsing**: Explore products with live search, category filters, and real-time product counts.
- **Image Gallery & Product Details**: Multi-image upload support with primary image designation stored securely in Cloud Storage (Supabase).
- **Persistent Shopping Cart**: Multi-item cart synchronized across sessions with atomic quantity updates.
- **Shipping Address Management**: Manage multiple delivery addresses with default selection (recipient name, phone, city, province, postal code).
- **Checkout & Financial Calculations**: Automated calculation of subtotals, shipping fees, taxes, and grand totals with zero precision loss.
- **Order Tracking & Visual Timeline**: Interactive progress stepper and chronological status history for every order.

### 🏪 Seller & Admin Dashboard
- **Product & Category Management**: Seamless product creation, editing, category classification, and asset management.
- **Stock Reservation System (Available vs. Reserved Stock)**: Prevents overselling by reserving inventory upon order creation and releasing it if an order expires.
- **Order State Transitions**: Process orders from preparation (`PROCESSING`) to dispatch (`SHIPPING`) and confirmation (`DELIVERED`/`COMPLETED`).

### 🛡️ Security & System Reliability
- **Secure Session-Based Authentication**: Encrypted, HTTP-only cookie authentication (`__pasaria_sid`) backed by Redis.
- **Role-Based Access Control (RBAC)**: Strict permission boundaries for `CUSTOMER`, `SELLER`, and `ADMIN`.
- **Idempotency Safeguards**: Prevents double-charges, repeated checkouts, and duplicate webhook submissions.
- **Webhook Deduplication & Event Auditing**: Robust logging and transaction verification for payment gateways.
- **Background Worker & Task Queues**: Redis-backed BullMQ workers handle delayed jobs, such as order payment expiration and async event processing.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Tw-Animate-CSS, Lucide React
- **UI Components**: Shadcn UI / Radix UI / Base UI
- **State Management**: Zustand & React Context
- **Data Fetching**: Axios / Native Fetch with typed service layer

### Backend
- **Framework**: Express 5.x + TypeScript
- **Architecture**: Modular Monolith (Controller → Service → Repository pattern)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Cache & Session**: Redis Cache & Redis Session Store
- **Queue / Asynchronous Worker**: BullMQ
- **Validation**: Zod Schemas
- **Storage / Media**: Multer + Supabase Storage Bucket
- **Testing**: Vitest & Supertest

---

## 📁 Directory Structure

```txt
pasaria-ecommerce/
├── backend/                         # Backend Service (Express + Prisma + BullMQ)
│   ├── modules/                     # Modular Monolith Domain Modules
│   │   ├── address/                 # Shipping Address Management
│   │   ├── auth/                    # Authentication & Session Handling
│   │   ├── authorization/           # Role-based middleware guards
│   │   ├── available/               # Stock Availability Domain
│   │   ├── cart/                    # Shopping Cart Domain
│   │   ├── category/                # Category Classification Domain
│   │   ├── checkout/                # Checkout & Bill Calculation
│   │   ├── inventory/               # Inventory Management
│   │   ├── order/                   # Order Lifecycle & Order Mapper
│   │   ├── ownership/               # Resource Ownership Guards
│   │   ├── payment/                 # Payment Gateway Integration & Webhooks
│   │   ├── product/                 # Product Catalog & Media Uploads
│   │   ├── reserved/                # Stock Reservation Logic
│   │   ├── shipping/                # Shipping Fee Calculation
│   │   └── user/                    # User Profile & Identity
│   ├── shared/                      # Shared Errors, Logger, Middleware & Utils
│   ├── infra/                       # Database, Redis Cache, Queue Worker
│   ├── prisma/                      # Prisma Schema & Migrations
│   ├── app.ts                       # Express Application Entry Point
│   └── worker.ts                    # BullMQ Queue Worker
│
├── frontend/                        # Frontend Web Application (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/                     # Next.js App Router Pages
│   │   │   ├── (main)/              # Main Storefront (Home, Products, Cart, Checkout, Orders)
│   │   │   ├── admin/               # Seller / Admin Dashboard
│   │   │   ├── auth/                # Authentication Pages (Login & Register)
│   │   │   └── category/            # Category Detail & Product Filtering
│   │   ├── components/              # Reusable UI & Feature Components
│   │   ├── services/                # Strongly-Typed API Client Services
│   │   ├── store/                   # Global Zustand Stores
│   │   └── types/                   # TypeScript Interfaces & API Models
│
├── docs/                            # Domain Modeling, API Contracts & Architecture Specs
├── overview.png                     # Application Overview Screenshot
└── render.yaml                      # Render Infrastructure Blueprint
```

---

## 🔄 Order Lifecycle & State Machine

Orders are governed by a deterministic finite state machine to guarantee transactional integrity:

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Checkout Initiated
    DRAFT --> WAITING_PAYMENT: Order Draft Created
    WAITING_PAYMENT --> PAID: Payment Confirmed (Webhook)
    WAITING_PAYMENT --> EXPIRED: Payment Timeout (Queue Worker)
    WAITING_PAYMENT --> CANCELLED: Cancelled by User / Admin
    PAID --> PROCESSING: Order Being Prepared by Seller
    PROCESSING --> SHIPPING: Order Handed Over to Courier
    SHIPPING --> DELIVERED: Order Reached Destination
    DELIVERED --> COMPLETED: Confirmed Received by Customer
    EXPIRED --> [*]
    CANCELLED --> [*]
    COMPLETED --> [*]
```

---

## 🔌 Key API Endpoints

### 🔐 Auth & User
- `POST /auth/register` — Register a new account
- `POST /auth/login` — Sign in and create session
- `POST /auth/logout` — Terminate session
- `GET /auth/me` — Retrieve authenticated user profile
- `GET /addresses` / `POST /addresses` — Manage user shipping addresses

### 📦 Products & Categories
- `GET /products` — List products (filtering, search, pagination)
- `GET /products/:id` — Retrieve product details and stock status
- `POST /products` — Create a new product *(Seller/Admin only)*
- `GET /categories` — List all categories with product counts

### 🛒 Cart & Checkout
- `GET /cart` — Get active cart items
- `POST /cart/items` — Add item to cart
- `PUT /cart/items/:id` — Update item quantity in cart
- `DELETE /cart/items/:id` — Remove item from cart
- `POST /checkout/preview` — Calculate price breakdown (subtotal, shipping, tax)

### 📋 Orders & Payments
- `POST /orders/draft` — Create an order draft from checkout
- `GET /orders` — List user orders (with status filters and pagination)
- `GET /orders/:id` — Get detailed order summary and timeline
- `POST /payment/create` — Initialize payment transaction with provider
- `POST /payment/webhook` — Secure webhook endpoint for payment gateways

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `v15+`
- **Redis**: `v6+`
- **NPM** or **PNPM**

### 1. Clone the Repository
```bash
git clone https://github.com/AhmadBayu1412/Pasaria-E-Commerce.git
cd Pasaria-E-Commerce
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client & Run Database Migrations
npx prisma generate
npx prisma db push

# Start Backend Development Server
npm run dev

# (Optional) Start Queue Worker in a separate terminal
npm run dev:worker
```
> Backend API will be running at: `http://localhost:3001`

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env.local

# Start Next.js Development Server
npm run dev
```
> Frontend application will be running at: `http://localhost:3000`

---

## ⚙️ Environment Variables Configuration

### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/pasaria_db?schema=public"
REDIS_URL="redis://localhost:6379"
SESSION_SECRET="your-super-secret-session-key"
SESSION_COOKIE_NAME="__pasaria_sid"
SESSION_TTL=86400
CORS_ORIGIN="http://localhost:3000"

# Supabase Storage (Product Media)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="product-images"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 🌐 Deployment

The codebase is pre-configured for frictionless cloud deployment:
- **Frontend**: Hosted on [Vercel](https://pasaria-e-commerce.vercel.app/)
- **Backend & Background Worker**: Deployed as interconnected web service & worker on [Render](https://render.com) using [`render.yaml`](file:///c:/Users/ThinkPad/Desktop/pasaria-ecommerce/render.yaml).
- **Database & Media**: Managed PostgreSQL and Supabase Object Storage.

---

## 🤖 AI-Assisted Engineering Workflow

The architecture and codebase of Pasaria were conceived and refined through a multi-model AI engineering pipeline:
1. **Gemini**: Domain exploration, UX flow ideation, and behavioral edge-case analysis.
2. **Claude**: In-depth code generation, Modular Monolith domain structuring, and transactional integrity implementation.
3. **ChatGPT**: Architectural cross-validation, state transition audits, and verification test strategies.

---

## 📄 License

This project is licensed under the ISC License. See the `LICENSE` file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/AhmadBayu1412">Ahmad Bayu</a>
</p>
