import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';

export function openDatabase(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('EMPLOYEE','HR','ADMIN')),
      email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1)),
      verification_code_hash TEXT,
      verification_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS employee_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      department TEXT,
      job_title TEXT,
      start_date TEXT,
      salary_cents INTEGER NOT NULL DEFAULT 0 CHECK(salary_cents >= 0),
      profile_photo_url TEXT,
      document_url TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      work_date TEXT NOT NULL,
      check_in_at TEXT,
      check_out_at TEXT,
      status TEXT NOT NULL CHECK(status IN ('PRESENT','ABSENT','HALF_DAY','LEAVE')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, work_date)
    );
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('PAID','SICK','UNPAID')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
      reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      reviewer_comments TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      decided_at TEXT
    );
    CREATE TABLE IF NOT EXISTS payroll_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pay_period TEXT NOT NULL,
      basic_cents INTEGER NOT NULL CHECK(basic_cents >= 0),
      allowance_cents INTEGER NOT NULL DEFAULT 0 CHECK(allowance_cents >= 0),
      deduction_cents INTEGER NOT NULL DEFAULT 0 CHECK(deduction_cents >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, pay_period)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
      related_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, work_date);
    CREATE INDEX IF NOT EXISTS idx_leave_employee_status ON leave_requests(employee_id, status);
    CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_records(employee_id, pay_period);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
  return db;
}

export function seedDemoData(db) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (count > 0) return;

  const addUser = (empId, userEmail, role, pw, name, phone, address, dept, title, startDate, salary) => {
    const id = randomUUID();
    db.prepare('INSERT INTO users (id, employee_id, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, 1)')
      .run(id, empId, userEmail, hashPassword(pw), role);
    db.prepare('INSERT INTO employee_profiles (user_id, full_name, phone, address, department, job_title, start_date, salary_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, phone, address, dept, title, startDate, salary);
    return id;
  };

  const adminId  = addUser('DF-ADMIN-001', 'admin@dayflow.local',    'ADMIN',    'Admin!12345',   'Avery Admin',  '+91 98765 43210', 'Mumbai, India',     'Operations',  'HR Director',       '2024-01-15', 12500000);
  const hrId     = addUser('DF-HR-001',    'hr@dayflow.local',       'HR',       'Hr!12345678',   'Harper Rao',   '+91 98765 43211', 'Bengaluru, India',  'People',      'HR Officer',        '2024-06-01', 8500000);
  const emp1Id   = addUser('DF-EMP-001',   'employee@dayflow.local', 'EMPLOYEE', 'Employee!123',  'Emery Patel',  '+91 90000 00001', 'Bengaluru, India',  'Engineering', 'Software Engineer', '2025-01-15', 7200000);
  const emp2Id   = addUser('DF-EMP-002',   'priya@dayflow.local',    'EMPLOYEE', 'Employee!123',  'Priya Sharma', '+91 90000 00002', 'Hyderabad, India',  'Design',      'UI/UX Designer',    '2025-03-01', 6800000);
  const emp3Id   = addUser('DF-EMP-003',   'arjun@dayflow.local',    'EMPLOYEE', 'Employee!123',  'Arjun Mehta',  '+91 90000 00003', 'Delhi, India',      'Marketing',   'Marketing Manager', '2024-11-01', 7500000);
  const emp4Id   = addUser('DF-EMP-004',   'neha@dayflow.local',     'EMPLOYEE', 'Employee!123',  'Neha Gupta',   '+91 90000 00004', 'Pune, India',       'Engineering', 'Backend Developer', '2025-02-15', 7000000);

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const period    = today.slice(0, 7);
  const dayAfter  = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

  // --- Attendance today ---
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status, notes) VALUES (?, ?, ?, ?, ?, 'PRESENT', ?)")
    .run(randomUUID(), emp1Id, today, `${today}T09:08:00.000Z`, `${today}T17:42:00.000Z`, 'Regular workday');
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, status, notes) VALUES (?, ?, ?, ?, 'PRESENT', ?)")
    .run(randomUUID(), emp2Id, today, `${today}T09:30:00.000Z`, 'Working remotely');
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, status, notes) VALUES (?, ?, ?, 'LEAVE', ?)")
    .run(randomUUID(), emp4Id, today, 'On approved sick leave');

  // --- Attendance yesterday ---
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')")
    .run(randomUUID(), emp1Id, yesterday, `${yesterday}T09:15:00.000Z`, `${yesterday}T18:00:00.000Z`);
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')")
    .run(randomUUID(), emp2Id, yesterday, `${yesterday}T09:45:00.000Z`, `${yesterday}T17:30:00.000Z`);
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')")
    .run(randomUUID(), emp3Id, yesterday, `${yesterday}T10:00:00.000Z`, `${yesterday}T17:00:00.000Z`);
  db.prepare("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')")
    .run(randomUUID(), emp4Id, yesterday, `${yesterday}T09:00:00.000Z`, `${yesterday}T17:45:00.000Z`);

  // --- Leave requests ---
  const leave1 = randomUUID();
  db.prepare("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'PAID', ?, ?, ?, 'APPROVED', ?, ?, CURRENT_TIMESTAMP)")
    .run(leave1, emp1Id, dayAfter(-7), dayAfter(-5), 'Family function', hrId, 'Approved. Enjoy!');
  const leave2 = randomUUID();
  db.prepare("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status) VALUES (?, ?, 'SICK', ?, ?, ?, 'PENDING')")
    .run(leave2, emp2Id, dayAfter(7), dayAfter(9), 'Medical appointment and follow-up');
  const leave3 = randomUUID();
  db.prepare("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'UNPAID', ?, ?, ?, 'REJECTED', ?, ?, CURRENT_TIMESTAMP)")
    .run(leave3, emp3Id, dayAfter(-7), dayAfter(-5), 'Personal work', adminId, 'Please reschedule to next month.');
  const leave4 = randomUUID();
  db.prepare("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'SICK', ?, ?, ?, 'APPROVED', ?, ?, CURRENT_TIMESTAMP)")
    .run(leave4, emp4Id, today, today, 'Not feeling well', hrId, 'Get well soon!');
  const leave5 = randomUUID();
  db.prepare("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status) VALUES (?, ?, 'PAID', ?, ?, ?, 'PENDING')")
    .run(leave5, emp1Id, dayAfter(14), dayAfter(16), 'Planned vacation');

  // --- Payroll records ---
  db.prepare('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), emp1Id, period, 6000000, 1500000, 200000);
  db.prepare('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), emp2Id, period, 5600000, 1400000, 180000);
  db.prepare('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), emp3Id, period, 6200000, 1600000, 250000);
  db.prepare('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), emp4Id, period, 5800000, 1450000, 200000);

  // --- Notifications ---
  const notify = (uid, type, title, msg, rel) =>
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), uid, type, title, msg, rel);
  notify(emp1Id, 'LEAVE_APPROVED', 'Leave Approved',  'Your paid leave request has been approved by Harper Rao.', leave1);
  notify(emp3Id, 'LEAVE_REJECTED', 'Leave Rejected',  'Your unpaid leave request has been rejected. Please reschedule to next month.', leave3);
  notify(emp4Id, 'LEAVE_APPROVED', 'Leave Approved',  'Your sick leave request has been approved by Harper Rao.', leave4);
  notify(hrId,   'LEAVE_SUBMITTED','New Leave Request','Priya Sharma submitted a sick leave request.', leave2);
  notify(hrId,   'LEAVE_SUBMITTED','New Leave Request','Emery Patel submitted a paid leave request.', leave5);
  notify(adminId,'LEAVE_SUBMITTED','New Leave Request','Priya Sharma submitted a sick leave request.', leave2);
  notify(adminId,'LEAVE_SUBMITTED','New Leave Request','Emery Patel submitted a paid leave request.', leave5);
  notify(emp1Id, 'PAYROLL',        'Payroll Processed',`Your payroll for ${period} has been processed.`, null);
  notify(emp2Id, 'PAYROLL',        'Payroll Processed',`Your payroll for ${period} has been processed.`, null);
}
