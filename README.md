# Dayflow HRMS — Modern Human Resource Management System

Dayflow is a fast, local-first, zero-dependency Human Resource Management System (HRMS) built for the Odoo Hackathon 2026. It features a complete SaaS-grade interface, full client-side SPA routing with browser history and direct URL access, role-based access control, persistent SQLite storage, real-time metrics, interactive attendance & leaves management, payroll visibility, and an in-app notification center.

---

## 🌟 Key Highlights

- **Zero External Dependencies**: Built with native Node.js 24+ (`node:http`, `node:sqlite`, `node:crypto`) and standard modern Web APIs (ES Modules, HTML5 History API, CSS Custom Properties, Vanilla JS).
- **True SPA Routing with Browser History**: Distinct isolated page views for `/dashboard`, `/employees`, `/employees/:id`, `/attendance`, `/leave`, `/payroll`, `/notifications`, `/profile`, `/settings`, and `/404`. Supports Back/Forward browser buttons, direct URL deep-linking, and route-preserving refresh.
- **Local-First & Offline Ready**: Runs completely offline without cloud database dependencies or external CDN font latency.
- **Modern SaaS UI/UX**: Professional split-screen auth, dark sidebar shell, live clock, status badges, toast alerts, modals, and responsive layout for mobile/desktop.
- **Testing Convenience**: 1-click quick-login buttons on the authentication page for instant testing as Admin, HR Officer, or Employee.
- **Real Relational Persistence**: Complete SQLite database backing users, profiles, attendance, leave requests, payroll history, and notifications.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 24+** (utilizes native `node:sqlite` module)

### Run the Application
```powershell
node src/server.js
```
Open **`http://localhost:3000`** in your browser.

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
node --test
```

---

## 🎬 Recommended Judge Demo Flow

1. **Quick Login as Employee**:
   - Click the green **Employee** quick-login button on `http://localhost:3000`.
   - On the Dashboard, verify the live clock and check-in status.
   - Click **Leave** in sidebar — notice URL changes to `http://localhost:3000/leave`.
   - Apply for leave next week.
   - Click **Attendance** — notice URL changes to `http://localhost:3000/attendance`.
   - Press browser **Back button** — verifies navigation back to `/leave`.
   - Sign out.

2. **Quick Login as HR Officer**:
   - Click the yellow **HR Officer** quick-login button.
   - Navigate to `/leave` — see pending employee request, click **Approve** with comment.
   - Navigate to `/employees` — search and click an employee to open `/employees/:id`.
   - Sign out.

3. **Quick Login as Admin**:
   - Click the red **Admin** quick-login button.
   - Navigate to `/payroll` — process a monthly payout slip.
   - Navigate to `/settings` — verify password change interface and session info.
   - Sign out.

4. **Verify Employee Updates**:
   - Log back in as **Employee**.
   - Navigate to `/notifications` — inspect approval & payroll notifications.
   - Refresh page at `/notifications` — verify route stays on `/notifications`.
   - Navigate to `/payroll` — verify updated salary and payout records.

---

## 📁 Repository Structure

```
├── data/
│   └── dayflow.db        # SQLite database (auto-created on launch)
├── docs/
│   └── SRS.md            # Software Requirements Specification
├── public/
│   ├── app.js            # Single Page Application (SPA) router & client engine
│   ├── index.html        # Main HTML shell & modal/toast containers
│   └── styles.css        # Modern SaaS CSS design system
├── src/
│   ├── auth.js           # Password derivation & HMAC token primitives
│   ├── database.js       # SQLite schema & demo data seeding
│   ├── server.js         # HTTP REST API & static/SPA route server
│   └── validation.js     # Payload & type validators
├── test/
│   └── hrms.test.js      # Integration test suite
├── package.json
└── README.md
```
