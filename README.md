# Dayflow HRMS — Modern Human Resource Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-6366f1?style=for-the-badge&logo=vercel)](https://dayflow-peach.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-6%2F6%20Passing-10b981?style=for-the-badge&logo=node.js)](https://github.com/jonekavish-dot/DAYFLOW-ODOO-NMIT-HACKATHON-2026)
[![Author](https://img.shields.io/badge/Author-jonekavish--dot-blue?style=for-the-badge&logo=github)](https://github.com/jonekavish-dot)
[![Hackathon](https://img.shields.io/badge/Odoo%20Hackathon-2026-ff5722?style=for-the-badge)](https://github.com/jonekavish-dot/DAYFLOW-ODOO-NMIT-HACKATHON-2026)

**Dayflow** is an ultra-modern, local-first Human Resource Management System (HRMS) engineered for the **Odoo Hackathon 2026**. It features a full SaaS-grade Glassmorphism interface, complete client-side SPA routing with browser history and direct URL access, role-based access control, dual-engine database persistence (SQLite local-first + PostgreSQL cloud production), real-time KPI metrics, interactive attendance & leave workflows, payroll management, and an in-app notification center.

---

## 🌐 Live URLs & Links

- 🚀 **Live Production Application**: **[https://dayflow-peach.vercel.app](https://dayflow-peach.vercel.app)**
- 📦 **GitHub Repository**: **[https://github.com/jonekavish-dot/DAYFLOW-ODOO-NMIT-HACKATHON-2026](https://github.com/jonekavish-dot/DAYFLOW-ODOO-NMIT-HACKATHON-2026)**
- 💻 **Local Development**: `http://localhost:3000`

---

## 👤 Author & Developer

| Creator | GitHub Handle | Email | Role |
|---|---|---|---|
| **Kavish** | [`jonekavish-dot`](https://github.com/jonekavish-dot) | `jonekavish@gmail.com` | **Full Stack Developer & Lead Architect** |

---

## 🌟 Key Highlights

- **Dual-Engine Persistence**:
  - **Local Development / Offline / Hackathon**: 100% local-first SQLite (`node:sqlite`) with zero cloud dependencies.
  - **Production / Cloud (Vercel)**: Serverless-compatible PostgreSQL (`pg`) with connection pooling, SSL, and auto-schema migration.
- **True SPA Routing with Browser History**: Distinct isolated page views for `/`, `/intro`, `/dashboard`, `/employees`, `/employees/:id`, `/attendance`, `/leave`, `/payroll`, `/notifications`, `/profile`, `/settings`, and `/404`. Supports Back/Forward browser buttons, direct URL deep-linking, and route-preserving refresh.
- **Glassmorphism Design System**: Ultra-modern frosted glass cards (`backdrop-filter: blur(28px)`), cosmic mesh gradients, floating animated bezier curves, and dark/light theme switching.
- **Testing Convenience**: 1-click quick-login buttons on the authentication page for instant testing as Admin, HR Officer, or Employee.
- **Complete Relational Schema**: Normalized tables for users, profiles, attendance, leave requests, payroll history, and notifications.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js 22+**

### Run Locally (100% Offline SQLite)
```powershell
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## ☁️ Production Deployment (Vercel + PostgreSQL)

Dayflow is fully configured for Vercel Serverless Functions and Edge CDN asset delivery:

### 1. Database Setup (Neon / Supabase / Vercel Postgres)
Create a free PostgreSQL database on [Neon.tech](https://neon.tech), [Supabase.com](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).

### 2. Configure Vercel Environment Variables
In your Vercel Project Settings &rarr; **Environment Variables**, add:
- `DATABASE_URL`: Your PostgreSQL connection string (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`)
- `DAYFLOW_SESSION_SECRET`: A secure random string for signing JWT tokens.
- `NODE_ENV`: `production`

### 3. Deploy
Push to GitHub `main` or deploy via Vercel CLI (`vercel --prod`).

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Email | Password | Quick Login Button |
|---|---|---|---|
| **Admin** | `admin@dayflow.local` | `Admin!12345` | 🔴 **Admin** |
| **HR Officer** | `hr@dayflow.local` | `Hr!12345678` | 🟡 **HR Officer** |
| **Employee** | `employee@dayflow.local` | `Employee!123` | 🟢 **Employee** |

*Additional seeded employees:*
- `priya@dayflow.local` (UI/UX Designer, Design)
- `arjun@dayflow.local` (Marketing Manager, Marketing)
- `neha@dayflow.local` (Backend Developer, Engineering)

---

## 🧭 Application Routes

| Route | Access | Description |
|---|---|---|
| `/` or `/intro` | Public | Animated landing hero with glowing paths and CTA |
| `/login` | Public | Split-screen authentication with 1-click quick login buttons |
| `/signup` | Public | Account registration form with validation |
| `/verify` | Public | 6-digit email code verification with clipboard copy |
| `/dashboard` | Authenticated | Role-aware dashboard with live clock & KPI statistics |
| `/employees` | HR / Admin | Searchable & filterable company-wide employee directory |
| `/employees/:id` | HR / Admin | Detailed employee profile view & editing modal |
| `/attendance` | Authenticated | Weekly attendance logs with previous/next week navigation |
| `/leave` | Authenticated | Time off application & approval decision interface |
| `/payroll` | Authenticated | Read-only salary breakdown (Employee) & payroll processing (Admin) |
| `/notifications` | Authenticated | Dedicated full-page notification center |
| `/profile` | Authenticated | Profile contact & personal information editing |
| `/settings` | Authenticated | Account security, session info & password update |

---

## 🧪 Run Automated Tests

Execute the native integration test suite:

```powershell
npm test
```

---

## 🎬 Recommended Judge Demo Flow

1. **Animated Intro & Quick Login**:
   - Open `http://localhost:3000` (or `https://dayflow-peach.vercel.app`) to see the animated floating paths hero. Click **Enter to Continue**.
   - Click the green **Employee** quick-login button.
   - On the Dashboard, verify the live clock and check-in status.
   - Click **Leave** in sidebar &rarr; apply for leave next week.
   - Click **Attendance** &rarr; press browser **Back button** to verify SPA history.
   - Sign out.

2. **HR Officer Flow**:
   - Click the yellow **HR Officer** quick-login button.
   - Navigate to `/leave` &rarr; approve the pending employee request with comments.
   - Navigate to `/employees` &rarr; search and view individual employee profiles.
   - Sign out.

3. **Admin & Employee Verification**:
   - Log in as **Admin** &rarr; navigate to `/payroll` &rarr; update employee pay slip.
   - Log back in as **Employee** &rarr; navigate to `/notifications` to verify approval and payroll notifications.

---

## 📁 Repository Structure

```
├── .env.example          # Environment variables template
├── api/
│   └── index.js          # Vercel Serverless Function entry point
├── data/
│   └── dayflow.db        # Local SQLite database (auto-created)
├── docs/
│   └── SRS.md            # Software Requirements Specification
├── public/
│   ├── app.js            # SPA router & UI component controllers
│   ├── index.html        # Main HTML shell & modal/toast containers
│   └── styles.css        # Ultra-modern Glassmorphism design system
├── src/
│   ├── auth.js           # Password derivation & HMAC token primitives
│   ├── db/
│   │   ├── index.js      # Dual-backend factory (SQLite / PostgreSQL)
│   │   ├── sqlite.js     # Native SQLite adapter (node:sqlite)
│   │   ├── postgres.js   # Serverless PostgreSQL adapter (pg)
│   │   └── seed.js       # Shared demo data seeding engine
│   ├── server.js         # HTTP REST API & static/SPA server
│   └── validation.js     # Payload & type validators
├── test/
│   └── hrms.test.js      # Integration test suite
├── package.json
├── vercel.json           # Vercel SPA rewrites & Edge CDN config
└── README.md
```
