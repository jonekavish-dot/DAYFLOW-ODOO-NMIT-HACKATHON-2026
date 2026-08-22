# Dayflow HRMS — Modern Human Resource Management System

Dayflow is a fast, local-first, zero-dependency Human Resource Management System (HRMS) built for the Odoo Hackathon 2026. It features a complete SaaS-grade interface, role-based access control, persistent SQLite storage, real-time metrics, interactive attendance & leaves management, payroll visibility, and an in-app notification center.

---

## 🌟 Key Highlights

- **Zero External Dependencies**: Built with native Node.js 24+ (`node:http`, `node:sqlite`, `node:crypto`) and standard modern Web APIs (ES Modules, CSS Custom Properties, Vanilla JS).
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

## 🧪 Run Automated Tests

Execute the native integration test suite:

```powershell
node --test
```

---

## 📋 Feature Breakdown

### 1. Authentication & Security
- **Secure Password Hashing**: Uses `node:crypto` `scrypt` with random 16-byte salts and `timingSafeEqual` comparison.
- **Signed Session Tokens**: HMAC-SHA256 tokens expiring in 8 hours.
- **Email Verification Flow**: Secure 6-digit verification code with instant local copy-to-clipboard widget.
- **Show/Hide Password**: Quick toggle on all authentication forms.

### 2. Employee Portal
- **Dashboard**: Live clock, today's attendance status, check-in/check-out buttons, pending leave counters, CTC salary preview, and recent leave history.
- **Attendance**: Daily check-in/out tracking with duration calculation, weekly record list, and week navigation (`Previous`, `Current`, `Next`).
- **Leave Management**: Apply for `Paid`, `Sick`, or `Unpaid` leave with date range validation and overlap prevention; view status & reviewer comments.
- **Payroll Visibility**: Read-only CTC structure, monthly salary slips with basic, allowances, deductions, and calculated net payout.
- **Profile Management**: View employment info; update phone number, address, profile photo URL, and document link.

### 3. HR & Admin Portal
- **Staff Dashboard**: Real-time KPI cards (Total employees, Present today, Absent today, On leave, Pending approvals).
- **Employee Directory**: Searchable & department-filterable employee directory with detailed editing modal.
- **Organisation Attendance**: Comprehensive view of company-wide attendance with supervisor status overrides (`PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`) and notes.
- **Leave Approvals**: Review pending leave requests, approve or reject with custom comments, and auto-dispatch notifications to employees.
- **Payroll Administration (Admin only)**: Process and upsert monthly payroll records and adjust base salaries with automatic net calculation.
- **In-App Notification Center**: Real-time notifications for submitted requests, approvals/rejections, and processed payroll with mark-as-read functionality.

---

## 🎬 Recommended Judge Demo Flow

1. **Quick Login as Employee**:
   - Click the green **Employee** quick-login button on `http://localhost:3000`.
   - On the Dashboard, verify the live clock and check-in status.
   - Go to **Leave Requests**, submit a leave request for next week.
   - Sign out.

2. **Quick Login as HR Officer**:
   - Click the yellow **HR Officer** quick-login button.
   - See the staff overview with real attendance counts and pending leave count.
   - Open **Leave Approvals**, find the employee's request, click **Approve** and add a comment.
   - Open **Organisation Attendance** and see company attendance for the week.
   - Sign out.

3. **Quick Login as Admin**:
   - Click the red **Admin** quick-login button.
   - Go to **Payroll Admin**, update an employee's salary and process a slip for the current month.
   - Open **Employees**, search for an employee, and edit their details in the modal.
   - Sign out.

4. **Verify Employee Updates**:
   - Log back in as **Employee**.
   - Check the **Notification Bell** (badge count indicator) — click to read the "Leave Approved" and "Payroll Processed" notifications.
   - Open **Leave Requests** — see the status changed to `APPROVED` with the reviewer's comment.
   - Open **My Payroll** — see the updated salary and monthly payout.

---

## 📁 Repository Structure

```
├── data/
│   └── dayflow.db        # SQLite database (auto-created on launch)
├── docs/
│   └── SRS.md            # Software Requirements Specification
├── public/
│   ├── app.js            # Single Page Application (SPA) client engine
│   ├── index.html        # Main HTML shell & modal/toast containers
│   └── styles.css        # Modern SaaS CSS design system
├── src/
│   ├── auth.js           # Password derivation & HMAC token primitives
│   ├── database.js       # SQLite schema & demo data seeding
│   ├── server.js         # HTTP REST API & static file server
│   └── validation.js     # Payload & type validators
├── test/
│   └── hrms.test.js      # Integration test suite
├── package.json
└── README.md
```
