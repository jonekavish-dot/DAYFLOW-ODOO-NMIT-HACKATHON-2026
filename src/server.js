import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createToken, hashPassword, newVerificationCode, readToken, verifyPassword } from './auth.js';
import { getDatabase } from './db/index.js';
import {
  ATTENDANCE_STATUSES, HttpError, LEAVE_STATUSES, LEAVE_TYPES, ROLES,
  cents, date, email, employeeId, enumValue, fail, month, optionalString, password, requiredString, url,
} from './validation.js';

const runtimeProcess = globalThis.process;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = existsSync(resolve(__dirname, '../public'))
  ? resolve(__dirname, '../public')
  : resolve(runtimeProcess?.cwd?.() || '.', 'public');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};

const nowDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: runtimeProcess?.env?.DAYFLOW_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const weekStart = (input) => {
  const checked = date(input, 'Week');
  const noon = new Date(`${checked}T12:00:00Z`);
  const weekday = noon.getUTCDay() || 7;
  noon.setUTCDate(noon.getUTCDate() - weekday + 1);
  return noon.toISOString().slice(0, 10);
};

const userProfile = async (db, id) => {
  const row = await db.get(`
    SELECT u.id, u.employee_id AS "employeeId", u.email, u.role, u.email_verified AS "emailVerified", u.created_at AS "createdAt",
           p.full_name AS "fullName", p.phone, p.address, p.department, p.job_title AS "jobTitle",
           p.start_date AS "startDate", p.salary_cents AS "salaryCents", p.profile_photo_url AS "profilePhotoUrl",
           p.document_url AS "documentUrl"
    FROM users u JOIN employee_profiles p ON p.user_id = u.id WHERE u.id = ? OR u.employee_id = ?`, [id, id]);
  return row || null;
};

const attendanceRow = async (db, id) => {
  const row = await db.get(`
    SELECT a.id, a.work_date AS "workDate", a.check_in_at AS "checkInAt", a.check_out_at AS "checkOutAt", a.status, a.notes,
           u.employee_id AS "employeeCode", p.full_name AS "employeeName"
    FROM attendance a JOIN users u ON u.id = a.employee_id JOIN employee_profiles p ON p.user_id = u.id WHERE a.id = ?`, [id]);
  return row || null;
};

const leaveRows = async (db, where, ...params) => {
  const args = params.filter((p) => p !== undefined);
  return db.query(`
    SELECT l.id, l.leave_type AS "leaveType", l.start_date AS "startDate", l.end_date AS "endDate", l.remarks, l.status,
           l.reviewer_comments AS "reviewerComments", l.created_at AS "createdAt", l.decided_at AS "decidedAt",
           l.employee_id AS "ownerId",
           u.employee_id AS "employeeCode", p.full_name AS "employeeName",
           reviewer.employee_id AS "reviewerCode", reviewerProfile.full_name AS "reviewerName"
    FROM leave_requests l
    JOIN users u ON u.id = l.employee_id JOIN employee_profiles p ON p.user_id = u.id
    LEFT JOIN users reviewer ON reviewer.id = l.reviewer_id LEFT JOIN employee_profiles reviewerProfile ON reviewerProfile.user_id = reviewer.id
    WHERE ${where} ORDER BY l.created_at DESC`, args);
};

async function createNotification(db, userId, type, title, message, relatedId = null) {
  await db.run('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), userId, type, title, message, relatedId]);
}

function parseBody(req) {
  return new Promise((resolveBody, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new HttpError(413, 'Request body is too large.'));
    });
    req.on('end', () => {
      if (!raw) return resolveBody({});
      try {
        const body = JSON.parse(raw);
        if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
        resolveBody(body);
      } catch { reject(new HttpError(400, 'Request body must be a JSON object.')); }
    });
    req.on('error', reject);
  });
}

async function bearerUser(db, req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = readToken(match?.[1]);
  if (!token) fail(401, 'Sign in is required.');
  const user = await userProfile(db, token.sub);
  if (!user || !user.emailVerified) fail(401, 'Your session is no longer valid.');
  return user;
}

function requireRole(user, ...roles) {
  if (!roles.includes(user.role)) fail(403, 'You do not have permission for this action.');
}

function profileUpdates(body, allowed) {
  const mapping = {
    fullName: ['full_name', (v) => requiredString(v, 'Full name', 120)], phone: ['phone', (v) => optionalString(v, 'Phone', 40)],
    address: ['address', (v) => optionalString(v, 'Address', 500)], department: ['department', (v) => optionalString(v, 'Department', 120)],
    jobTitle: ['job_title', (v) => optionalString(v, 'Job title', 120)], startDate: ['start_date', (v) => v === null || v === '' ? null : date(v, 'Start date')],
    salaryCents: ['salary_cents', (v) => cents(v, 'Salary')], profilePhotoUrl: ['profile_photo_url', (v) => url(v, 'Profile photo URL')],
    documentUrl: ['document_url', (v) => url(v, 'Document URL')],
  };
  const changes = [];
  for (const key of allowed) if (Object.hasOwn(body, key)) {
    const [column, validate] = mapping[key];
    changes.push([column, validate(body[key])]);
  }
  if (!changes.length) fail(400, 'Provide at least one editable field.');
  return changes;
}

async function runProfileUpdate(db, targetId, changes) {
  const fields = changes.map(([column]) => `${column} = ?`).join(', ');
  const values = [...changes.map(([, value]) => value), targetId];
  await db.run(`UPDATE employee_profiles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, values);
  return userProfile(db, targetId);
}

async function serveStatic(res, pathname) {
  const hasExt = pathname.includes('.') && !pathname.endsWith('/');
  if (hasExt) {
    const filename = resolve(publicDir, `.${pathname}`);
    if (!filename.startsWith(publicDir + sep)) return json(res, 404, { error: 'Not found.' });
    try {
      const content = await readFile(filename);
      const extension = filename.slice(filename.lastIndexOf('.'));
      res.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream' });
      return res.end(content);
    } catch {
      return json(res, 404, { error: 'Not found.' });
    }
  }

  // SPA Route Fallback: serve index.html for all top-level application routes
  try {
    const indexHtml = await readFile(join(publicDir, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexHtml);
  } catch {
    json(res, 404, { error: 'Not found.' });
  }
}

export async function createApp({ db: customDb, dbPath, databaseUrl, seed = true } = {}) {
  const db = customDb || await getDatabase({ dbPath, databaseUrl, seed });

  const handler = async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, { Allow: 'GET, POST, PATCH, PUT, OPTIONS' });
        return res.end();
      }
      const requestUrl = new URL(req.url, 'http://localhost');
      const { pathname, searchParams } = requestUrl;
      if (!pathname.startsWith('/api/')) return serveStatic(res, pathname);
      const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await parseBody(req) : {};

      if (req.method === 'GET' && pathname === '/api/health') {
        return json(res, 200, { status: 'ok', database: db.type });
      }

      // --- Auth ---
      if (req.method === 'POST' && pathname === '/api/auth/register') {
        const employeeCode = employeeId(body.employeeId);
        const userEmail = email(body.email);
        const selectedRole = enumValue(body.role, new Set(['EMPLOYEE', 'HR']), 'Role');
        const code = newVerificationCode();
        const id = randomUUID();
        try {
          await db.run(
            `INSERT INTO users (id, employee_id, email, password_hash, role, email_verified, verification_code_hash, verification_expires_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now', '+15 minutes'))`,
            [id, employeeCode, userEmail, hashPassword(password(body.password)), selectedRole, hashPassword(code)]
          );
          await db.run('INSERT INTO employee_profiles (user_id, full_name) VALUES (?, ?)',
            [id, optionalString(body.fullName, 'Full name', 120) || employeeCode]);
        } catch (error) {
          if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate key')) {
            fail(409, 'That employee ID or email is already registered.');
          }
          throw error;
        }
        return json(res, 201, { message: 'Account created. Verify it before signing in.', developmentVerificationCode: code });
      }

      if (req.method === 'POST' && pathname === '/api/auth/verify-email') {
        const userEmail = email(body.email);
        const code = requiredString(body.code, 'Verification code', 6);
        const user = await db.get('SELECT * FROM users WHERE email = ?', [userEmail]);
        const nowUtc = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const expiresAt = user?.verification_expires_at ? String(user.verification_expires_at).replace('T', ' ').slice(0, 19) : null;
        if (!user || user.email_verified || !expiresAt || expiresAt < nowUtc || !verifyPassword(code, user.verification_code_hash)) {
          fail(400, 'The verification code is invalid or expired.');
        }
        await db.run('UPDATE users SET email_verified = 1, verification_code_hash = NULL, verification_expires_at = NULL WHERE id = ?', [user.id]);
        return json(res, 200, { message: 'Email verified. You can now sign in.' });
      }

      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email(body.email)]);
        if (!user || !verifyPassword(body.password || '', user.password_hash)) fail(401, 'Email or password is incorrect.');
        if (!user.email_verified) fail(403, 'Verify your email before signing in.');
        const profile = await userProfile(db, user.id);
        return json(res, 200, { token: createToken(profile), user: profile });
      }

      // --- Authenticated routes ---
      const currentUser = await bearerUser(db, req);
      if (req.method === 'GET' && pathname === '/api/auth/me') return json(res, 200, { user: currentUser });

      if (req.method === 'POST' && pathname === '/api/auth/change-password') {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [currentUser.id]);
        if (!user || !verifyPassword(body.currentPassword || '', user.password_hash)) fail(400, 'Current password is incorrect.');
        const newPw = password(body.newPassword);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(newPw), currentUser.id]);
        return json(res, 200, { message: 'Password updated successfully.' });
      }

      // --- Dashboard ---
      if (req.method === 'GET' && pathname === '/api/dashboard') {
        const today = nowDate();
        const unreadRow = await db.get('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [currentUser.id]);
        const unreadNotifications = Number(unreadRow?.count || 0);

        if (currentUser.role === 'EMPLOYEE') {
          const attendance = await db.get('SELECT * FROM attendance WHERE employee_id = ? AND work_date = ?', [currentUser.id, today]) || null;
          const pendingRow = await db.get("SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'PENDING'", [currentUser.id]);
          const approvedRow = await db.get("SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'APPROVED'", [currentUser.id]);
          const recentLeaves = (await leaveRows(db, 'l.employee_id = ?', currentUser.id)).slice(0, 5);
          return json(res, 200, {
            kind: 'employee',
            today,
            attendance,
            pendingLeaves: Number(pendingRow?.count || 0),
            approvedLeaves: Number(approvedRow?.count || 0),
            recentLeaves,
            unreadNotifications,
            salaryCents: currentUser.salaryCents,
          });
        }

        const totalEmpRow = await db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'EMPLOYEE'");
        const presentRow = await db.get("SELECT COUNT(*) AS count FROM attendance WHERE work_date = ? AND status IN ('PRESENT','HALF_DAY')", [today]);
        const leaveRow = await db.get("SELECT COUNT(*) AS count FROM attendance WHERE work_date = ? AND status = 'LEAVE'", [today]);
        const pendingRow = await db.get("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'PENDING'");

        const totalEmployees = Number(totalEmpRow?.count || 0);
        const presentToday = Number(presentRow?.count || 0);
        const onLeaveToday = Number(leaveRow?.count || 0);
        const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

        return json(res, 200, {
          kind: 'staff',
          today,
          totalEmployees,
          presentToday,
          absentToday,
          onLeaveToday,
          pendingLeaves: Number(pendingRow?.count || 0),
          unreadNotifications,
          recentLeaves: (await leaveRows(db, '1 = 1')).slice(0, 5),
        });
      }

      // --- Profile ---
      if (pathname === '/api/profile') {
        if (req.method === 'GET') return json(res, 200, { profile: await userProfile(db, currentUser.id) });
        if (req.method === 'PATCH') {
          return json(res, 200, { profile: await runProfileUpdate(db, currentUser.id, profileUpdates(body, ['phone', 'address', 'profilePhotoUrl', 'documentUrl'])) });
        }
      }

      // --- Attendance ---
      if (req.method === 'GET' && pathname === '/api/attendance/me') {
        const start = weekStart(searchParams.get('week') || nowDate());
        const end = new Date(`${start}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 6);
        const records = await db.query(`
          SELECT id, work_date AS "workDate", check_in_at AS "checkInAt", check_out_at AS "checkOutAt", status, notes
          FROM attendance WHERE employee_id = ? AND work_date BETWEEN ? AND ? ORDER BY work_date DESC`,
          [currentUser.id, start, end.toISOString().slice(0, 10)]);
        return json(res, 200, { weekStart: start, records });
      }

      if (req.method === 'POST' && pathname === '/api/attendance/check-in') {
        const today = nowDate();
        const existing = await db.get('SELECT id FROM attendance WHERE employee_id = ? AND work_date = ?', [currentUser.id, today]);
        if (existing) fail(409, 'You already have an attendance record for today.');
        const id = randomUUID();
        await db.run(
          "INSERT INTO attendance (id, employee_id, work_date, check_in_at, status, notes) VALUES (?, ?, ?, ?, 'PRESENT', ?)",
          [id, currentUser.id, today, new Date().toISOString(), optionalString(body.notes, 'Notes', 500)]
        );
        return json(res, 201, { attendance: await attendanceRow(db, id) });
      }

      if (req.method === 'POST' && pathname === '/api/attendance/check-out') {
        const today = nowDate();
        const existing = await db.get('SELECT id, check_out_at AS "checkOutAt" FROM attendance WHERE employee_id = ? AND work_date = ?', [currentUser.id, today]);
        if (!existing?.id) fail(400, 'Check in before checking out.');
        if (existing.checkOutAt) fail(409, 'You have already checked out today.');
        await db.run('UPDATE attendance SET check_out_at = ? WHERE id = ?', [new Date().toISOString(), existing.id]);
        return json(res, 200, { attendance: await attendanceRow(db, existing.id) });
      }

      if (req.method === 'GET' && pathname === '/api/attendance') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const start = weekStart(searchParams.get('week') || nowDate());
        const end = new Date(`${start}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 6);
        const requestedEmployee = searchParams.get('employeeId');
        const records = await db.query(`
          SELECT a.id, a.work_date AS "workDate", a.check_in_at AS "checkInAt", a.check_out_at AS "checkOutAt", a.status, a.notes,
                 u.id AS "employeeId", u.employee_id AS "employeeCode", p.full_name AS "employeeName"
          FROM attendance a JOIN users u ON u.id = a.employee_id JOIN employee_profiles p ON p.user_id = u.id
          WHERE a.work_date BETWEEN ? AND ? ${requestedEmployee ? 'AND u.id = ?' : ''} ORDER BY a.work_date DESC, p.full_name`,
          requestedEmployee ? [start, end.toISOString().slice(0, 10), requestedEmployee] : [start, end.toISOString().slice(0, 10)]);
        return json(res, 200, { weekStart: start, records });
      }

      const attendanceMatch = /^\/api\/attendance\/([^/]+)$/.exec(pathname);
      if (attendanceMatch && req.method === 'PUT') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const record = await attendanceRow(db, attendanceMatch[1]);
        if (!record) fail(404, 'Attendance record not found.');
        const status = enumValue(body.status, ATTENDANCE_STATUSES, 'Attendance status');
        const notes = optionalString(body.notes, 'Notes', 500);
        await db.run('UPDATE attendance SET status = ?, notes = ? WHERE id = ?', [status, notes, record.id]);
        return json(res, 200, { attendance: await attendanceRow(db, record.id) });
      }

      // --- Leave ---
      if (pathname === '/api/leaves') {
        if (req.method === 'GET') return json(res, 200, { leaves: await leaveRows(db, 'l.employee_id = ?', currentUser.id) });
        if (req.method === 'POST') {
          const startDate = date(body.startDate, 'Start date');
          const endDate = date(body.endDate, 'End date');
          if (endDate < startDate) fail(400, 'End date cannot be before start date.');
          const overlapRow = await db.get(
            "SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status != 'REJECTED' AND start_date <= ? AND end_date >= ?",
            [currentUser.id, endDate, startDate]
          );
          if (Number(overlapRow?.count || 0) > 0) fail(409, 'You already have a leave request that overlaps with these dates.');
          const id = randomUUID();
          const leaveType = enumValue(body.leaveType, LEAVE_TYPES, 'Leave type');
          await db.run(
            'INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks) VALUES (?, ?, ?, ?, ?, ?)',
            [id, currentUser.id, leaveType, startDate, endDate, optionalString(body.remarks, 'Remarks', 1000)]
          );
          const staffUsers = await db.query("SELECT id FROM users WHERE role IN ('HR', 'ADMIN')");
          for (const staff of staffUsers) {
            await createNotification(db, staff.id, 'LEAVE_SUBMITTED', 'New Leave Request',
              `${currentUser.fullName} submitted a ${leaveType.toLowerCase()} leave request (${startDate} to ${endDate}).`, id);
          }
          const [newLeave] = await leaveRows(db, 'l.id = ?', id);
          return json(res, 201, { leave: newLeave });
        }
      }

      if (req.method === 'GET' && pathname === '/api/leaves/all') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const requestedStatus = searchParams.get('status');
        if (requestedStatus) enumValue(requestedStatus, LEAVE_STATUSES, 'Leave status');
        const where = requestedStatus ? 'l.status = ?' : '1 = 1';
        return json(res, 200, { leaves: requestedStatus ? await leaveRows(db, where, requestedStatus) : await leaveRows(db, where) });
      }

      const leaveDecisionMatch = /^\/api\/leaves\/([^/]+)\/decision$/.exec(pathname);
      if (leaveDecisionMatch && req.method === 'PATCH') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const decision = enumValue(body.status, new Set(['APPROVED', 'REJECTED']), 'Decision');
        const existing = await db.get('SELECT status, employee_id FROM leave_requests WHERE id = ?', [leaveDecisionMatch[1]]);
        if (!existing) fail(404, 'Leave request not found.');
        if (existing.status !== 'PENDING') fail(409, 'Only pending leave requests can be decided.');
        await db.run(
          'UPDATE leave_requests SET status = ?, reviewer_id = ?, reviewer_comments = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?',
          [decision, currentUser.id, optionalString(body.comments, 'Comments', 1000), leaveDecisionMatch[1]]
        );
        const [leaveData] = await leaveRows(db, 'l.id = ?', leaveDecisionMatch[1]);
        await createNotification(db, existing.employee_id,
          decision === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          decision === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
          `Your ${leaveData.leaveType.toLowerCase()} leave request (${leaveData.startDate} to ${leaveData.endDate}) has been ${decision.toLowerCase()} by ${currentUser.fullName}.${body.comments ? ' Comment: ' + body.comments : ''}`,
          leaveDecisionMatch[1]);
        return json(res, 200, { leave: leaveData });
      }

      // --- Employees ---
      if (req.method === 'GET' && pathname === '/api/employees') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const employees = await db.query(`
          SELECT u.id, u.employee_id AS "employeeId", u.email, u.role, u.email_verified AS "emailVerified",
                 p.full_name AS "fullName", p.phone, p.address, p.department, p.job_title AS "jobTitle", p.start_date AS "startDate",
                 p.salary_cents AS "salaryCents", p.profile_photo_url AS "profilePhotoUrl", p.document_url AS "documentUrl"
          FROM users u JOIN employee_profiles p ON p.user_id = u.id ORDER BY p.full_name`);
        return json(res, 200, { employees });
      }

      const employeeGetMatch = /^\/api\/employees\/([^/]+)$/.exec(pathname);
      if (employeeGetMatch && req.method === 'GET') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const employee = await userProfile(db, employeeGetMatch[1]);
        if (!employee) fail(404, 'Employee not found.');
        return json(res, 200, { employee });
      }

      const employeeMatch = /^\/api\/employees\/([^/]+)$/.exec(pathname);
      if (employeeMatch && req.method === 'PATCH') {
        requireRole(currentUser, 'HR', 'ADMIN');
        const target = await userProfile(db, employeeMatch[1]);
        if (!target) fail(404, 'Employee not found.');
        const allowed = ['fullName', 'phone', 'address', 'department', 'jobTitle', 'startDate', 'profilePhotoUrl', 'documentUrl'];
        if (currentUser.role === 'ADMIN') allowed.push('salaryCents');
        else if (Object.hasOwn(body, 'salaryCents')) fail(403, 'Only an admin can change salary.');
        return json(res, 200, { employee: await runProfileUpdate(db, target.id, profileUpdates(body, allowed)) });
      }

      // --- Payroll ---
      if (req.method === 'GET' && pathname === '/api/payroll/me') {
        const records = await db.query(`
          SELECT id, pay_period AS "payPeriod", basic_cents AS "basicCents", allowance_cents AS "allowanceCents",
                 deduction_cents AS "deductionCents", (basic_cents + allowance_cents - deduction_cents) AS "netCents"
          FROM payroll_records WHERE employee_id = ? ORDER BY pay_period DESC`, [currentUser.id]);
        const prof = await userProfile(db, currentUser.id);
        return json(res, 200, { salaryCents: prof.salaryCents, records });
      }

      if (req.method === 'GET' && pathname === '/api/payroll') {
        requireRole(currentUser, 'ADMIN');
        const records = await db.query(`
          SELECT r.id, r.employee_id AS "employeeId", u.employee_id AS "employeeCode", p.full_name AS "employeeName",
                 r.pay_period AS "payPeriod", r.basic_cents AS "basicCents", r.allowance_cents AS "allowanceCents", r.deduction_cents AS "deductionCents",
                 (r.basic_cents + r.allowance_cents - r.deduction_cents) AS "netCents"
          FROM payroll_records r JOIN users u ON u.id = r.employee_id JOIN employee_profiles p ON p.user_id = u.id
          ORDER BY r.pay_period DESC, p.full_name`);
        return json(res, 200, { records });
      }

      const payrollMatch = /^\/api\/payroll\/([^/]+)$/.exec(pathname);
      if (payrollMatch && req.method === 'PUT') {
        requireRole(currentUser, 'ADMIN');
        const target = await userProfile(db, payrollMatch[1]);
        if (!target) fail(404, 'Employee not found.');
        const payPeriod = month(body.payPeriod);
        const basicCents = cents(body.basicCents, 'Basic salary');
        const allowanceCents = cents(body.allowanceCents ?? 0, 'Allowance');
        const deductionCents = cents(body.deductionCents ?? 0, 'Deduction');
        if (Object.hasOwn(body, 'salaryCents')) {
          await runProfileUpdate(db, target.id, [['salary_cents', cents(body.salaryCents, 'Salary')]]);
        }
        await db.run(
          `INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents)
           VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(employee_id, pay_period) DO UPDATE SET basic_cents = excluded.basic_cents,
           allowance_cents = excluded.allowance_cents, deduction_cents = excluded.deduction_cents, updated_at = CURRENT_TIMESTAMP`,
          [randomUUID(), target.id, payPeriod, basicCents, allowanceCents, deductionCents]
        );
        await createNotification(db, target.id, 'PAYROLL', 'Payroll Updated',
          `Your payroll for ${payPeriod} has been updated by ${currentUser.fullName}.`, null);
        return json(res, 200, { message: 'Payroll saved.' });
      }

      // --- Notifications ---
      if (req.method === 'GET' && pathname === '/api/notifications') {
        const notifications = await db.query(`
          SELECT id, type, title, message, is_read AS "isRead", related_id AS "relatedId", created_at AS "createdAt"
          FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, [currentUser.id]);
        const unreadRow = await db.get('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [currentUser.id]);
        return json(res, 200, { notifications, unreadCount: Number(unreadRow?.count || 0) });
      }

      const notifReadMatch = /^\/api\/notifications\/([^/]+)\/read$/.exec(pathname);
      if (notifReadMatch && req.method === 'PATCH') {
        const notif = await db.get('SELECT id, user_id FROM notifications WHERE id = ?', [notifReadMatch[1]]);
        if (!notif) fail(404, 'Notification not found.');
        if (notif.user_id !== currentUser.id) fail(403, 'You can only read your own notifications.');
        await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifReadMatch[1]]);
        return json(res, 200, { message: 'Notification marked as read.' });
      }

      if (req.method === 'PATCH' && pathname === '/api/notifications/read-all') {
        await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [currentUser.id]);
        return json(res, 200, { message: 'All notifications marked as read.' });
      }

      return json(res, 404, { error: 'API route not found.' });
    } catch (error) {
      if (error instanceof HttpError) return json(res, error.status, { error: error.message });
      console.error('Server Internal Error:', error?.message);
      return json(res, 500, { error: 'An unexpected server error occurred.' });
    }
  };

  return { handler, close: () => db.close(), db };
}

if (runtimeProcess?.argv?.[1] && resolve(runtimeProcess.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createApp();
  const port = Number(runtimeProcess.env.PORT || 3000);
  createServer(app.handler).listen(port, () => console.log(`Dayflow HRMS is running at http://localhost:${port} [DB: ${app.db.type}]`));
}
