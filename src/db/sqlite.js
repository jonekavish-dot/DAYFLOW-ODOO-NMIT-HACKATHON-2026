import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class SqliteDatabase {
  constructor(filename) {
    this.type = 'sqlite';
    this.filename = filename;
    if (filename && filename !== ':memory:' && !filename.startsWith(':memory:')) {
      try {
        mkdirSync(dirname(filename), { recursive: true });
      } catch {}
    }
    try {
      this.db = new DatabaseSync(filename);
    } catch (err) {
      if (err?.code === 'ERR_SQLITE_ERROR' && (err?.errcode === 14 || String(err?.message).includes('unable to open'))) {
        console.warn(`[SqliteDatabase] Path "${filename}" not writable in this environment. Falling back to in-memory SQLite.`);
        this.filename = ':memory:';
        this.db = new DatabaseSync(':memory:');
      } else {
        throw err;
      }
    }
    this.db.exec('PRAGMA foreign_keys = ON;');
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
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
  }

  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) || null;
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }

  async exec(sql) {
    return this.db.exec(sql);
  }

  async close() {
    return this.db.close();
  }
}
