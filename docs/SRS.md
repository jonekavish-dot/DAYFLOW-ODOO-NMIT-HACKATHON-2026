# Dayflow HRMS - Software Requirements Specification

## 1. Purpose and scope

Dayflow is a Human Resource Management System that digitises essential daily HR work: authentication, employee records, attendance, leave, approval, and payroll visibility. This MVP is a single-organisation web application designed for a local deployment.

The source statement explicitly names employee onboarding, profile management, daily/weekly attendance, leave and time-off, payroll visibility, role-based access, and HR approval workflows. Email alerts, reports, and salary slips are listed as future enhancements and are therefore deliberately outside the MVP.

## 2. Functional requirements

| ID | Requirement | MVP acceptance criterion |
| --- | --- | --- |
| FR-01 | Register accounts | A user registers with an employee ID, email, password, and Employee or HR role. Duplicate IDs/emails are rejected. |
| FR-02 | Verify email | A newly registered account cannot log in until its one-time verification code is submitted. Local development exposes that code only in the registration response, rather than pretending to send an email. |
| FR-03 | Sign in/out | Verified users sign in with email/password, receive a signed session token, and can sign out by clearing it. Bad credentials return an actionable error. |
| FR-04 | Role-based access | Employees access only their own profile, attendance, leave requests, and payroll. HR may manage people, attendance, and leave decisions. Admin additionally changes salary/payroll data. |
| FR-05 | Profile management | Employees view all profile fields and change their address, phone, photo URL, and document URL. HR/Admin can edit all profile/job fields. |
| FR-06 | Attendance | Employees check in once and check out once per day, then view daily/weekly attendance. HR/Admin view all records and set a valid status. |
| FR-07 | Leave requests | Employees submit Paid, Sick, or Unpaid leave with a valid date range and remarks, then see their request status. |
| FR-08 | Leave approval | HR/Admin list all requests and approve or reject pending requests with optional comments. The employee's view refreshes from persistent data. |
| FR-09 | Payroll visibility | Employees view their read-only salary structure and payroll entries. Admin lists and updates payroll entries and salary structure. |
| FR-10 | Dashboards | Employee and staff dashboards show role-appropriate counts, recent items, and navigable modules. |

## 3. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Security: passwords are salted and derived with `scrypt`; tokens are HMAC-signed and expire after 8 hours. |
| NFR-02 | Security: every protected server route enforces authentication and role/ownership checks; the UI is not the security boundary. |
| NFR-03 | Validation: request bodies, IDs, dates, enums, email, password strength, and state transitions are validated server-side. |
| NFR-04 | Persistence: SQLite holds all application data; no static JSON data powers application features. |
| NFR-05 | Usability: responsive, keyboard-accessible forms provide visible success/error feedback and clear empty states. |
| NFR-06 | Reliability: schema creation and demo data seeding are idempotent; API errors use consistent JSON responses. |
| NFR-07 | Maintainability: the backend is separated into database, auth, validation, API, and static client concerns; automated tests cover critical flows. |
| NFR-08 | Local operability: the app starts using the Node runtime only and documents the seeded local accounts. |

## 4. Roles and workflows

| Role | Permissions |
| --- | --- |
| Employee | Manage restricted personal contact/profile links; check in/out; view own weekly attendance; request leave; view own leave status and payroll. |
| HR Officer | All employee permissions plus list/manage employee profile/job data, view/manage attendance, and decide leave requests. HR cannot alter payroll/salary. |
| Admin | All HR permissions plus update salary structure and payroll records. |

### Employee workflow

1. Register, receive the local development verification code, verify email, and sign in.
2. Review profile and update allowed contact fields.
3. Check in at the start of the day and check out at the end; use weekly attendance to review history.
4. Submit a leave request and later review its HR decision/comments.
5. View read-only salary structure and payroll entries.

### HR/Admin workflow

1. Sign in to the staff dashboard.
2. Find an employee and maintain profile/job details.
3. Review attendance across the organisation and correct a status when needed.
4. Review pending leave and approve/reject it with a comment.
5. Admin only: maintain salary structure and monthly payroll records.

## 5. Data design

```mermaid
erDiagram
  USERS ||--|| EMPLOYEE_PROFILES : has
  USERS ||--o{ ATTENDANCE : records
  USERS ||--o{ LEAVE_REQUESTS : submits
  USERS ||--o{ LEAVE_REQUESTS : reviews
  USERS ||--o{ PAYROLL_RECORDS : receives
  USERS {
    text id PK
    text employee_id UK
    text email UK
    text password_hash
    text role
    integer email_verified
  }
  EMPLOYEE_PROFILES {
    text user_id PK_FK
    text job_title
    text department
    integer salary_cents
  }
  ATTENDANCE {
    text id PK
    text employee_id FK
    text work_date
    text check_in_at
    text check_out_at
    text status
  }
  LEAVE_REQUESTS {
    text id PK
    text employee_id FK
    text leave_type
    text start_date
    text end_date
    text status
    text reviewer_id FK
  }
  PAYROLL_RECORDS {
    text id PK
    text employee_id FK
    text pay_period
    integer basic_cents
    integer allowance_cents
    integer deduction_cents
  }
```

Key constraints: `users.employee_id` and `users.email` are unique; attendance is unique per `(employee_id, work_date)`; payroll is unique per `(employee_id, pay_period)`; status/type/role values are constrained in SQLite; money is stored as integer cents to avoid floating-point errors.

## 6. REST API design

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create unverified employee/HR account. |
| POST | `/api/auth/verify-email` | Public | Verify the one-time code. |
| POST | `/api/auth/login` | Public | Return session token and user. |
| GET | `/api/auth/me` | Authenticated | Return current user. |
| GET/PATCH | `/api/profile` | Authenticated | Get own profile; update permitted personal fields. |
| GET | `/api/dashboard` | Authenticated | Return role-specific dashboard data. |
| GET | `/api/attendance/me?week=YYYY-MM-DD` | Employee | Own weekly records. |
| POST | `/api/attendance/check-in` | Employee | Check in for the current local date. |
| POST | `/api/attendance/check-out` | Employee | Check out for the current local date. |
| GET | `/api/attendance?week=...&employeeId=...` | HR/Admin | Organisation attendance records. |
| PUT | `/api/attendance/:id` | HR/Admin | Set attendance status/times. |
| GET/POST | `/api/leaves` | Authenticated | List own leaves; employee creates a request. |
| GET | `/api/leaves/all?status=...` | HR/Admin | List all leave requests. |
| PATCH | `/api/leaves/:id/decision` | HR/Admin | Approve/reject a pending request. |
| GET | `/api/employees` | HR/Admin | List employee profiles. |
| PATCH | `/api/employees/:id` | HR/Admin | Change all employee profile/job details. |
| GET | `/api/payroll/me` | Employee | Read own salary/payroll. |
| GET | `/api/payroll` | Admin | List employee payroll. |
| PUT | `/api/payroll/:employeeId` | Admin | Upsert salary structure and payroll record. |

All error responses use `{ "error": "human-readable message" }`; successful mutating calls return the saved resource. Requests use a `Bearer` token after login.

## 7. Frontend screens

| Screen | Main content and actions |
| --- | --- |
| Sign in | Email/password, error feedback, registration link. |
| Register / verify | Employee ID, email, password, role, local verification code, then verification form. |
| Dashboard | Role-specific metrics and recent attendance/leave information. |
| My profile | Personal and job data; field-level editable contact/link values. |
| My attendance | Check in/out state plus daily/weekly record table. |
| My leave | Leave form and status table. |
| My payroll | Read-only salary structure and payroll table. |
| Employees (HR/Admin) | Employee list, selection, editable staff form. |
| Organisation attendance (HR/Admin) | Week filter, employee records, status editing. |
| Leave approvals (HR/Admin) | All leave requests and decision controls. |
| Payroll administration (Admin) | Employee/pay-period payroll form and salary fields. |

## 8. Implementation plan

1. Create schema, indexes, database connection, demo seed accounts, and request/auth utilities.
2. Implement authentication, role/ownership middleware, profile, dashboard, attendance, leave, employee, and payroll REST endpoints.
3. Build a responsive single-page frontend that consumes those endpoints and only shows actions that the signed-in role can use.
4. Add server-side validation and integration tests for registration/verification, ownership boundaries, attendance, leave decisions, and payroll permissions.
5. Run tests, resolve defects, start the server, exercise the local health/API route, and document setup plus deliberate MVP limits.
