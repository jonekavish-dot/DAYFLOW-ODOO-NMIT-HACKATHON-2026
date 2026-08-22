import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';

let DatabaseSync = null;
try {
  const sqliteModule = await import('node:sqlite');
  DatabaseSync = sqliteModule.DatabaseSync || sqliteModule.default?.DatabaseSync;
} catch (err) {
  // node:sqlite not present in runtime (e.g. AWS Lambda / Vercel Serverless)
}

// ============================================================================
// In-Memory Database Fallback for Serverless environments without node:sqlite
// ============================================================================
class MemoryDatabase {
  constructor() {
    this.tables = {
      users: [],
      employee_profiles: [],
      attendance: [],
      leave_requests: [],
      payroll_records: [],
      notifications: [],
    };
  }

  exec() {
    // DDL schema setup is handled by MemoryDatabase in-memory tables
  }

  close() {}

  prepare(sql) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
    const db = this;

    return {
      run(...params) {
        return db._executeRun(cleanSql, params);
      },
      get(...params) {
        const rows = db._executeQuery(cleanSql, params);
        return rows[0] || undefined;
      },
      all(...params) {
        return db._executeQuery(cleanSql, params);
      },
    };
  }

  _executeRun(sql, params) {
    // --- INSERT INTO users ---
    if (sql.startsWith('INSERT INTO users')) {
      const [id, employee_id, email, password_hash, role, email_verified, verification_code_hash, verification_expires_at] = params;
      const user = {
        id: id || randomUUID(),
        employee_id,
        email,
        password_hash,
        role,
        email_verified: email_verified ?? 0,
        verification_code_hash: verification_code_hash ?? null,
        verification_expires_at: verification_expires_at ?? null,
        created_at: new Date().toISOString(),
      };
      this.tables.users.push(user);
      return { changes: 1, lastInsertRowid: this.tables.users.length };
    }

    // --- INSERT INTO employee_profiles ---
    if (sql.startsWith('INSERT INTO employee_profiles')) {
      const [user_id, full_name, phone, address, department, job_title, start_date, salary_cents] = params;
      const profile = {
        user_id,
        full_name: full_name || '',
        phone: phone ?? null,
        address: address ?? null,
        department: department ?? null,
        job_title: job_title ?? null,
        start_date: start_date ?? null,
        salary_cents: salary_cents ?? 0,
        profile_photo_url: null,
        document_url: null,
        updated_at: new Date().toISOString(),
      };
      this.tables.employee_profiles.push(profile);
      return { changes: 1, lastInsertRowid: this.tables.employee_profiles.length };
    }

    // --- INSERT INTO attendance ---
    if (sql.startsWith('INSERT INTO attendance')) {
      const [id, employee_id, work_date, check_in_at, check_out_at_or_status, status_or_notes, notes_if_present] = params;
      let check_out_at = null;
      let status = 'PRESENT';
      let notes = null;

      if (params.length === 7) {
        check_out_at = check_out_at_or_status;
        status = status_or_notes || 'PRESENT';
        notes = notes_if_present ?? null;
      } else if (params.length === 6) {
        status = check_out_at_or_status;
        notes = status_or_notes ?? null;
      } else if (params.length === 5) {
        status = check_out_at_or_status;
      }

      const att = {
        id: id || randomUUID(),
        employee_id,
        work_date,
        check_in_at: check_in_at || null,
        check_out_at,
        status,
        notes,
        created_at: new Date().toISOString(),
      };
      this.tables.attendance.push(att);
      return { changes: 1, lastInsertRowid: this.tables.attendance.length };
    }

    // --- INSERT INTO leave_requests ---
    if (sql.startsWith('INSERT INTO leave_requests')) {
      const [id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments] = params;
      const req = {
        id: id || randomUUID(),
        employee_id,
        leave_type,
        start_date,
        end_date,
        remarks: remarks ?? null,
        status: status || 'PENDING',
        reviewer_id: reviewer_id ?? null,
        reviewer_comments: reviewer_comments ?? null,
        created_at: new Date().toISOString(),
        decided_at: status && status !== 'PENDING' ? new Date().toISOString() : null,
      };
      this.tables.leave_requests.push(req);
      return { changes: 1, lastInsertRowid: this.tables.leave_requests.length };
    }

    // --- INSERT INTO payroll_records ---
    if (sql.startsWith('INSERT INTO payroll_records')) {
      const [id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents] = params;
      const rec = {
        id: id || randomUUID(),
        employee_id,
        pay_period,
        basic_cents: basic_cents ?? 0,
        allowance_cents: allowance_cents ?? 0,
        deduction_cents: deduction_cents ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.tables.payroll_records.push(rec);
      return { changes: 1, lastInsertRowid: this.tables.payroll_records.length };
    }

    // --- INSERT INTO notifications ---
    if (sql.startsWith('INSERT INTO notifications')) {
      const [id, user_id, type, title, message, related_id] = params;
      const notif = {
        id: id || randomUUID(),
        user_id,
        type,
        title,
        message,
        is_read: 0,
        related_id: related_id ?? null,
        created_at: new Date().toISOString(),
      };
      this.tables.notifications.push(notif);
      return { changes: 1, lastInsertRowid: this.tables.notifications.length };
    }

    // --- UPDATE users ---
    if (sql.startsWith('UPDATE users')) {
      if (sql.includes('email_verified = 1')) {
        const [userId] = params;
        const u = this.tables.users.find(x => x.id === userId);
        if (u) {
          u.email_verified = 1;
          u.verification_code_hash = null;
          u.verification_expires_at = null;
          return { changes: 1 };
        }
      }
      if (sql.includes('password_hash = ?')) {
        const [newHash, userId] = params;
        const u = this.tables.users.find(x => x.id === userId);
        if (u) {
          u.password_hash = newHash;
          return { changes: 1 };
        }
      }
      return { changes: 0 };
    }

    // --- UPDATE employee_profiles ---
    if (sql.startsWith('UPDATE employee_profiles')) {
      const userId = params[params.length - 1];
      const p = this.tables.employee_profiles.find(x => x.user_id === userId);
      if (p) {
        if (sql.includes('salary_cents = ?')) {
          const [salary] = params;
          p.salary_cents = salary;
        }
        if (sql.includes('full_name = ?') || sql.includes('phone = ?') || sql.includes('address = ?')) {
          // generic update
          let paramIdx = 0;
          if (sql.includes('full_name = ?')) p.full_name = params[paramIdx++];
          if (sql.includes('phone = ?')) p.phone = params[paramIdx++];
          if (sql.includes('address = ?')) p.address = params[paramIdx++];
          if (sql.includes('department = ?')) p.department = params[paramIdx++];
          if (sql.includes('job_title = ?')) p.job_title = params[paramIdx++];
          if (sql.includes('start_date = ?')) p.start_date = params[paramIdx++];
          if (sql.includes('profile_photo_url = ?')) p.profile_photo_url = params[paramIdx++];
          if (sql.includes('document_url = ?')) p.document_url = params[paramIdx++];
        }
        p.updated_at = new Date().toISOString();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // --- UPDATE attendance ---
    if (sql.startsWith('UPDATE attendance')) {
      if (sql.includes('check_out_at = ?')) {
        const [checkOut, id] = params;
        const a = this.tables.attendance.find(x => x.id === id);
        if (a) {
          a.check_out_at = checkOut;
          return { changes: 1 };
        }
      }
      if (sql.includes('status = ?')) {
        const [status, notes, id] = params;
        const a = this.tables.attendance.find(x => x.id === id);
        if (a) {
          a.status = status;
          a.notes = notes;
          return { changes: 1 };
        }
      }
      return { changes: 0 };
    }

    // --- UPDATE leave_requests ---
    if (sql.startsWith('UPDATE leave_requests')) {
      const [status, comments, revId, id] = params;
      const l = this.tables.leave_requests.find(x => x.id === id);
      if (l) {
        l.status = status;
        l.reviewer_comments = comments;
        l.reviewer_id = revId;
        l.decided_at = new Date().toISOString();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // --- UPDATE notifications ---
    if (sql.startsWith('UPDATE notifications')) {
      if (sql.includes('is_read = 1 WHERE id = ?')) {
        const [id] = params;
        const n = this.tables.notifications.find(x => x.id === id);
        if (n) {
          n.is_read = 1;
          return { changes: 1 };
        }
      }
      if (sql.includes('is_read = 1 WHERE user_id = ?')) {
        const [uid] = params;
        let count = 0;
        for (const n of this.tables.notifications) {
          if (n.user_id === uid && !n.is_read) {
            n.is_read = 1;
            count++;
          }
        }
        return { changes: count };
      }
      return { changes: 0 };
    }

    return { changes: 0 };
  }

  _executeQuery(sql, params) {
    // --- SELECT COUNT(*) ---
    if (sql.includes('COUNT(*) AS count FROM users')) {
      if (sql.includes("role = 'EMPLOYEE'")) {
        return [{ count: this.tables.users.filter(u => u.role === 'EMPLOYEE').length }];
      }
      return [{ count: this.tables.users.length }];
    }

    if (sql.includes('COUNT(*) AS count FROM notifications')) {
      const [userId] = params;
      return [{ count: this.tables.notifications.filter(n => n.user_id === userId && !n.is_read).length }];
    }

    if (sql.includes('COUNT(*) AS count FROM leave_requests')) {
      if (sql.includes("status = 'PENDING'") && !sql.includes('employee_id = ?')) {
        return [{ count: this.tables.leave_requests.filter(l => l.status === 'PENDING').length }];
      }
      if (sql.includes("status = 'PENDING'") && sql.includes('employee_id = ?')) {
        const [empId] = params;
        return [{ count: this.tables.leave_requests.filter(l => l.employee_id === empId && l.status === 'PENDING').length }];
      }
      if (sql.includes("status = 'APPROVED'") && sql.includes('employee_id = ?')) {
        const [empId] = params;
        return [{ count: this.tables.leave_requests.filter(l => l.employee_id === empId && l.status === 'APPROVED').length }];
      }
      if (sql.includes('start_date <= ? AND end_date >= ?')) {
        const [empId, end, start] = params;
        const matches = this.tables.leave_requests.filter(l => l.employee_id === empId && l.status !== 'REJECTED' && l.start_date <= end && l.end_date >= start);
        return [{ count: matches.length }];
      }
      return [{ count: 0 }];
    }

    if (sql.includes('COUNT(*) AS count FROM attendance')) {
      const [today] = params;
      if (sql.includes("status IN ('PRESENT','HALF_DAY')")) {
        return [{ count: this.tables.attendance.filter(a => a.work_date === today && (a.status === 'PRESENT' || a.status === 'HALF_DAY')).length }];
      }
      if (sql.includes("status = 'LEAVE'")) {
        return [{ count: this.tables.attendance.filter(a => a.work_date === today && a.status === 'LEAVE').length }];
      }
      return [{ count: 0 }];
    }

    // --- Users ---
    if (sql.startsWith('SELECT * FROM users WHERE email = ?')) {
      const [email] = params;
      const u = this.tables.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      return u ? [u] : [];
    }

    if (sql.startsWith('SELECT * FROM users WHERE id = ?')) {
      const [id] = params;
      const u = this.tables.users.find(x => x.id === id);
      return u ? [u] : [];
    }

    if (sql.startsWith("SELECT id FROM users WHERE role IN ('HR', 'ADMIN')")) {
      return this.tables.users.filter(u => u.role === 'HR' || u.role === 'ADMIN').map(u => ({ id: u.id }));
    }

    // --- userProfile (Users + Employee Profiles JOIN) ---
    if (sql.includes('FROM users u JOIN employee_profiles p ON p.user_id = u.id WHERE u.id = ? OR u.employee_id = ?')) {
      const [id] = params;
      const u = this.tables.users.find(x => x.id === id || x.employee_id === id);
      if (!u) return [];
      const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
      return [{
        id: u.id,
        employeeId: u.employee_id,
        email: u.email,
        role: u.role,
        emailVerified: u.email_verified,
        createdAt: u.created_at,
        fullName: p.full_name || '',
        phone: p.phone,
        address: p.address,
        department: p.department,
        jobTitle: p.job_title,
        startDate: p.start_date,
        salaryCents: p.salary_cents || 0,
        profilePhotoUrl: p.profile_photo_url,
        documentUrl: p.document_url,
      }];
    }

    // --- Employee List Directory ---
    if (sql.includes('FROM users u JOIN employee_profiles p ON p.user_id = u.id') && !sql.includes('WHERE u.id = ?')) {
      return this.tables.users.map(u => {
        const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
        return {
          id: u.id,
          employeeId: u.employee_id,
          email: u.email,
          role: u.role,
          emailVerified: u.email_verified,
          createdAt: u.created_at,
          fullName: p.full_name || '',
          phone: p.phone,
          address: p.address,
          department: p.department,
          jobTitle: p.job_title,
          startDate: p.start_date,
          salaryCents: p.salary_cents || 0,
          profilePhotoUrl: p.profile_photo_url,
          documentUrl: p.document_url,
        };
      });
    }

    // --- Attendance single row ---
    if (sql.startsWith('SELECT * FROM attendance WHERE employee_id = ? AND work_date = ?')) {
      const [empId, date] = params;
      const a = this.tables.attendance.find(x => x.employee_id === empId && x.work_date === date);
      return a ? [a] : [];
    }

    if (sql.startsWith('SELECT id FROM attendance WHERE employee_id = ? AND work_date = ?')) {
      const [empId, date] = params;
      const a = this.tables.attendance.find(x => x.employee_id === empId && x.work_date === date);
      return a ? [{ id: a.id }] : [];
    }

    if (sql.startsWith('SELECT id, check_out_at FROM attendance WHERE employee_id = ? AND work_date = ?')) {
      const [empId, date] = params;
      const a = this.tables.attendance.find(x => x.employee_id === empId && x.work_date === date);
      return a ? [{ id: a.id, check_out_at: a.check_out_at }] : [];
    }

    if (sql.includes('FROM attendance a JOIN users u ON u.id = a.employee_id JOIN employee_profiles p ON p.user_id = u.id WHERE a.id = ?')) {
      const [id] = params;
      const a = this.tables.attendance.find(x => x.id === id);
      if (!a) return [];
      const u = this.tables.users.find(x => x.id === a.employee_id) || {};
      const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
      return [{
        id: a.id,
        workDate: a.work_date,
        checkInAt: a.check_in_at,
        checkOutAt: a.check_out_at,
        status: a.status,
        notes: a.notes,
        employeeCode: u.employee_id,
        employeeName: p.full_name || '',
      }];
    }

    // --- Attendance list (Employee) ---
    if (sql.includes('FROM attendance WHERE employee_id = ? ORDER BY work_date DESC')) {
      const [empId] = params;
      return this.tables.attendance
        .filter(x => x.employee_id === empId)
        .sort((a, b) => b.work_date.localeCompare(a.work_date))
        .map(a => ({
          id: a.id,
          workDate: a.work_date,
          checkInAt: a.check_in_at,
          checkOutAt: a.check_out_at,
          status: a.status,
          notes: a.notes,
        }));
    }

    // --- Attendance list (Staff/Admin) ---
    if (sql.includes('FROM attendance a JOIN users u ON u.id = a.employee_id JOIN employee_profiles p ON p.user_id = u.id')) {
      let list = this.tables.attendance;
      if (sql.includes('work_date = ?')) {
        const [date] = params;
        list = list.filter(x => x.work_date === date);
      }
      return list.map(a => {
        const u = this.tables.users.find(x => x.id === a.employee_id) || {};
        const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
        return {
          id: a.id,
          workDate: a.work_date,
          checkInAt: a.check_in_at,
          checkOutAt: a.check_out_at,
          status: a.status,
          notes: a.notes,
          employeeCode: u.employee_id,
          employeeName: p.full_name || '',
        };
      });
    }

    // --- Leave Requests (leaveRows) ---
    if (sql.includes('FROM leave_requests l JOIN users u ON u.id = l.employee_id')) {
      let list = this.tables.leave_requests;
      if (sql.includes('WHERE l.id = ?')) {
        const [id] = params;
        list = list.filter(l => l.id === id);
      } else if (sql.includes('WHERE l.employee_id = ?')) {
        const [empId] = params;
        list = list.filter(l => l.employee_id === empId);
      }
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(l => {
        const u = this.tables.users.find(x => x.id === l.employee_id) || {};
        const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
        const rev = this.tables.users.find(x => x.id === l.reviewer_id);
        const revP = rev ? this.tables.employee_profiles.find(x => x.user_id === rev.id) : null;
        return {
          id: l.id,
          leaveType: l.leave_type,
          startDate: l.start_date,
          endDate: l.end_date,
          remarks: l.remarks,
          status: l.status,
          reviewerComments: l.reviewer_comments,
          createdAt: l.created_at,
          decidedAt: l.decided_at,
          employeeCode: u.employee_id,
          employeeName: p.full_name || '',
          employeeId: u.id,
          reviewerName: revP?.full_name || null,
        };
      });
    }

    // --- Payroll Records ---
    if (sql.includes('FROM payroll_records r JOIN users u ON u.id = r.employee_id')) {
      let list = this.tables.payroll_records;
      if (sql.includes('r.employee_id = ?')) {
        const [empId] = params;
        list = list.filter(x => x.employee_id === empId);
      }
      return list.map(r => {
        const u = this.tables.users.find(x => x.id === r.employee_id) || {};
        const p = this.tables.employee_profiles.find(x => x.user_id === u.id) || {};
        return {
          id: r.id,
          payPeriod: r.pay_period,
          basicCents: r.basic_cents,
          allowanceCents: r.allowance_cents,
          deduction_cents: r.deduction_cents,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          employeeCode: u.employee_id,
          employeeName: p.full_name || '',
          jobTitle: p.job_title,
          department: p.department,
        };
      });
    }

    // --- Notifications ---
    if (sql.startsWith('SELECT id, type, title, message, is_read AS isRead, related_id AS relatedId, created_at AS createdAt FROM notifications WHERE user_id = ?')) {
      const [userId] = params;
      return this.tables.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          relatedId: n.related_id,
          createdAt: n.created_at,
        }));
    }

    if (sql.startsWith('SELECT * FROM notifications WHERE id = ?')) {
      const [id] = params;
      const n = this.tables.notifications.find(x => x.id === id);
      return n ? [n] : [];
    }

    return [];
  }
}

export function openDatabase(filename) {
  if (DatabaseSync) {
    if (filename && filename !== ':memory:' && !filename.startsWith(':memory:')) {
      try {
        mkdirSync(dirname(filename), { recursive: true });
      } catch {}
    }
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

  // Fallback to MemoryDatabase when node:sqlite is unavailable on serverless
  return new MemoryDatabase();
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
