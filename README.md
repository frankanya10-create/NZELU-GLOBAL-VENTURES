# NGV ERP & Inventory Management System

Welcome to the **Nzelu Global Ventures (NGV) ERP & Inventory Management System**. This is a production-ready, full-stack enterprise resource planning (ERP) system designed specifically for managing roll-based inventory (e.g., carpets, tarpaulins, artificial grass, center rugs) and service installations (e.g., custom tents and artificial grass setups).

The application is structured as a decoupled monorepo containing a **Next.js frontend** and an **Express/Node.js backend REST API** connected to **MongoDB**.

---

## 🌟 Key Features

### 1. Specialised Roll-Based Inventory
- **Roll Management**: Track products sold by rolls. Maintain precise logs of original roll lengths and widths.
- **Cutting History**: Log physical cuts made to rolls, detailing who performed the cut, the remaining balance, and custom measurements.
- **Stock Control**: Monitor real-time quantities, stock levels, and valuations.

### 2. Multi-Branch Operations
- **Branch Tracking**: Segment inventory, sales, and personnel by branch location.
- **Stock Transfers**: Intelligently transfer rolls and products between branches, requiring storekeeper or manager approvals.

### 3. Role-Based Access Control (RBAC)
Four primary user roles are supported, each with dedicated dashboard layouts, UI permissions, and API guards:
- **Administrator**: Complete control over users, branches, system settings, global logs, and database metrics.
- **Manager**: Monitors daily sales report, stock valuation, approves custom pricing/discounts, and audits transactions.
- **Cashier**: Generates proforma (quotations) and standard sales invoices, handles client information, and records payments.
- **Storekeeper**: Updates inventory quantities, logs roll cuts, manages warehouse dispatches, and handles branch-to-branch transfers.

### 4. Financial & Invoicing Suite
- **Invoice Options**: Support for both standard sales invoices and proforma invoices (quotations).
- **Convertible Invoices**: Instantly convert proforma invoices to finalized invoices once payment is confirmed.
- **Expense Logging**: Track operational expenses (logistics, maintenance, staff allowances) for clear Profit & Loss (P&L) calculations.
- **Stock Valuation & P&L**: Automatically calculate inventory valuation and profit margins based on product cost and selling price.

### 5. Installation & Delivery Logistics
- **Delivery Tracker**: Monitor product shipping status, driver assignments, and delivery completion.
- **Installation Tracker**: Coordinate offsite setup dates, team assignments, and client sign-offs (e.g., for tents and grass turf).

### 6. High-Grade Security
- **Two-Factor Authentication (2FA)**: Google Authenticator/Speakeasy OTP support for accounts.
- **Auto-Logout & Inactivity Checks**: Secure client sessions by logging users out after a customizable duration of inactivity.
- **Audit Logs**: Maintain a permanent ledger of system events, logins, edits, deletes, and financial changes.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand
- **Animations**: GSAP (GreenSock Animation Platform)
- **Styling**: Tailwind CSS & custom utility classes
- **HTTP Client**: Axios (with custom interceptors for automatic JWT attachment and 401 timeout redirects)

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose ODM
- **Security**: JSON Web Tokens (JWT), BcryptJS, Express Rate Limit (API protection), and Speakeasy (TOTP 2FA)
- **Utilities**: GeoIP-lite & Useragent (for logging login locations and device details)

---

## 🚀 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance

---

### Step 1: Clone and Configure Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and configure the variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=8h
   OTP_SECRET=your_otp_encryption_salt
   PORT=5000
   NODE_ENV=development
   INACTIVITY_TIMEOUT=900000 # 15 minutes in milliseconds
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

### Step 2: Configure and Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the backend URL if running in a non-standard port by setting the environment variable:
   ```env
   BACKEND_URL=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## 📁 Project Directory Structure
```text
├── backend/
│   ├── config/          # Database connection setup
│   ├── middleware/      # Authentication & route rate limiters
│   ├── models/          # Mongoose Schemas (User, Roll, Invoice, etc.)
│   ├── routes/          # Express API route endpoints
│   ├── utils/           # Helper scripts (2FA, mail, calculations)
│   ├── server.js        # Main entry point for the backend API
│   └── package.json
│
├── frontend/
│   ├── public/          # Static assets & logos
│   ├── src/
│   │   ├── app/         # Next.js App Router (Layouts & Pages)
│   │   ├── components/  # Reusable UI component blocks (Invoices, layout, etc.)
│   │   ├── context/     # Dark/Light Theme Context
│   │   ├── lib/         # Axios client and API calls handler
│   │   ├── store/       # Zustand Global Auth State
│   │   └── styles/      # Global CSS files
│   ├── next.config.js   # Next.js configurations & API proxies
│   └── package.json
│
└── README.md            # Root description file
```

---

## 🛡️ License
This project is proprietary and custom-built for **Nzelu Global Ventures**. All rights reserved.
