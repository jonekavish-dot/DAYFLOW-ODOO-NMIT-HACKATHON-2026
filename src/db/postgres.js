import pg from 'pg';

const { Pool } = pg;

export class PostgresDatabase {
  constructor(connectionString) {
    this.type = 'postgres';
    this.connectionString = connectionString;
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    this.pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.schemaInitialized = false;
    this.initPromise = this._initSchema();
  }

  _translateSql(sql) {
    let index = 1;
    let translated = sql.replace(/\?/g, () => `$${index++}`);
    // Translate SQLite datetime functions to Postgres equivalents
    translated = translated.replace(/datetime\('now',\s*'\+15 minutes'\)/gi, "NOW() + INTERVAL '15 minutes'");
    return translated;
  }

  async _initSchema() {
    if (this.schemaInitialized) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(32) NOT NULL CHECK(role IN ('EMPLOYEE','HR','ADMIN')),
          email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1)),
          verification_code_hash TEXT,
          verification_expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS employee_profiles (
          user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(64),
          address TEXT,
          department VARCHAR(128),
          job_title VARCHAR(128),
          start_date VARCHAR(32),
          salary_cents BIGINT NOT NULL DEFAULT 0 CHECK(salary_cents >= 0),
          profile_photo_url TEXT,
          document_url TEXT,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS attendance (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_date VARCHAR(32) NOT NULL,
          check_in_at VARCHAR(64),
          check_out_at VARCHAR(64),
          status VARCHAR(32) NOT NULL CHECK(status IN ('PRESENT','ABSENT','HALF_DAY','LEAVE')),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_attendance_emp_date UNIQUE(employee_id, work_date)
        );

        CREATE TABLE IF NOT EXISTS leave_requests (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          leave_type VARCHAR(32) NOT NULL CHECK(leave_type IN ('PAID','SICK','UNPAID')),
          start_date VARCHAR(32) NOT NULL,
          end_date VARCHAR(32) NOT NULL,
          remarks TEXT,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
          reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          reviewer_comments TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          decided_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS payroll_records (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pay_period VARCHAR(32) NOT NULL,
          basic_cents BIGINT NOT NULL CHECK(basic_cents >= 0),
          allowance_cents BIGINT NOT NULL DEFAULT 0 CHECK(allowance_cents >= 0),
          deduction_cents BIGINT NOT NULL DEFAULT 0 CHECK(deduction_cents >= 0),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_payroll_emp_period UNIQUE(employee_id, pay_period)
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
          related_id VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, work_date);
        CREATE INDEX IF NOT EXISTS idx_leave_employee_status ON leave_requests(employee_id, status);
        CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_records(employee_id, pay_period);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
      `);
      this.schemaInitialized = true;
    } catch (err) {
      console.error('PostgreSQL Schema Initialization Error:', err?.message);
      throw err;
    }
  }

  async _ensureReady() {
    if (!this.schemaInitialized) {
      await this.initPromise;
    }
  }

  async query(sql, params = []) {
    await this._ensureReady();
    const translated = this._translateSql(sql);
    const result = await this.pool.query(translated, params);
    // Convert BigInt / numeric fields to standard numbers for JSON parity
    return result.rows.map(row => this._normalizeRow(row));
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async run(sql, params = []) {
    await this._ensureReady();
    const translated = this._translateSql(sql);
    const result = await this.pool.query(translated, params);
    return { changes: result.rowCount || 0 };
  }

  async exec(sql) {
    return this.pool.query(sql);
  }

  async close() {
    return this.pool.end();
  }

  _normalizeRow(row) {
    if (!row) return row;
    const normalized = { ...row };
    if (typeof normalized.salarycents === 'string' || typeof normalized.salarycents === 'bigint') {
      normalized.salaryCents = Number(normalized.salarycents);
    }
    if (typeof normalized.salary_cents === 'string' || typeof normalized.salary_cents === 'bigint') {
      normalized.salary_cents = Number(normalized.salary_cents);
    }
    if (typeof normalized.basiccents === 'string' || typeof normalized.basiccents === 'bigint') {
      normalized.basicCents = Number(normalized.basiccents);
    }
    if (typeof normalized.allowancecents === 'string' || typeof normalized.allowancecents === 'bigint') {
      normalized.allowanceCents = Number(normalized.allowancecents);
    }
    if (typeof normalized.deductioncents === 'string' || typeof normalized.deductioncents === 'bigint') {
      normalized.deductionCents = Number(normalized.deductioncents);
    }
    if (typeof normalized.netcents === 'string' || typeof normalized.netcents === 'bigint') {
      normalized.netCents = Number(normalized.netcents);
    }
    if (typeof normalized.count === 'string' || typeof normalized.count === 'bigint') {
      normalized.count = Number(normalized.count);
    }
    return normalized;
  }
}
