import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/server.js';

async function withApp(seed, run) {
  const app = await createApp({ dbPath: ':memory:', seed });
  const server = createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { method = 'GET', token, body } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    return { status: response.status, data, contentType };
  };
  try { return await run(request); } finally { await new Promise((resolve) => server.close(resolve)); await app.close(); }
}

async function login(request, email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(result.status, 200, result.data.error);
  return result.data.token;
}

test('registration requires verification before a user can sign in', async () => {
  await withApp(false, async (request) => {
    const registration = await request('/api/auth/register', { method: 'POST', body: { fullName: 'Casey Test', employeeId: 'TEST-001', email: 'casey@example.test', password: 'Valid!12345', role: 'EMPLOYEE' } });
    assert.equal(registration.status, 201);
    assert.match(registration.data.developmentVerificationCode, /^\d{6}$/);
    const beforeVerification = await request('/api/auth/login', { method: 'POST', body: { email: 'casey@example.test', password: 'Valid!12345' } });
    assert.equal(beforeVerification.status, 403);
    const verification = await request('/api/auth/verify-email', { method: 'POST', body: { email: 'casey@example.test', code: registration.data.developmentVerificationCode } });
    assert.equal(verification.status, 200);
    const afterVerification = await request('/api/auth/login', { method: 'POST', body: { email: 'casey@example.test', password: 'Valid!12345' } });
    assert.equal(afterVerification.status, 200);
    assert.equal(afterVerification.data.user.emailVerified, 1);
  });
});

test('employee attendance can be checked in and out once', async () => {
  await withApp(true, async (request) => {
    const token = await login(request, 'employee@dayflow.local', 'Employee!123');
    const registered = await request('/api/auth/register', { method: 'POST', body: { fullName: 'Alex Checkin', employeeId: 'CHECK-001', email: 'alex@example.test', password: 'Valid!12345', role: 'EMPLOYEE' } });
    await request('/api/auth/verify-email', { method: 'POST', body: { email: 'alex@example.test', code: registered.data.developmentVerificationCode } });
    const freshToken = await login(request, 'alex@example.test', 'Valid!12345');
    const checkIn = await request('/api/attendance/check-in', { method: 'POST', token: freshToken, body: {} });
    assert.equal(checkIn.status, 201);
    const duplicate = await request('/api/attendance/check-in', { method: 'POST', token: freshToken, body: {} });
    assert.equal(duplicate.status, 409);
    const checkOut = await request('/api/attendance/check-out', { method: 'POST', token: freshToken, body: {} });
    assert.equal(checkOut.status, 200);
    assert.ok(checkOut.data.attendance.checkOutAt);
    const ownAttendance = await request('/api/attendance/me', { token });
    assert.equal(ownAttendance.status, 200);
  });
});

test('HR can decide pending leave, overlapping leaves rejected, notifications created', async () => {
  await withApp(true, async (request) => {
    const employeeToken = await login(request, 'employee@dayflow.local', 'Employee!123');
    const forbidden = await request('/api/leaves/all', { token: employeeToken });
    assert.equal(forbidden.status, 403);
    
    // Submit valid leave
    const requested = await request('/api/leaves', { method: 'POST', token: employeeToken, body: { leaveType: 'SICK', startDate: '2026-12-10', endDate: '2026-12-12', remarks: 'Test illness' } });
    assert.equal(requested.status, 201);

    // Overlapping leave submission must fail with 409
    const overlapping = await request('/api/leaves', { method: 'POST', token: employeeToken, body: { leaveType: 'PAID', startDate: '2026-12-11', endDate: '2026-12-13', remarks: 'Overlap' } });
    assert.equal(overlapping.status, 409);

    const hrToken = await login(request, 'hr@dayflow.local', 'Hr!12345678');
    const decision = await request(`/api/leaves/${requested.data.leave.id}/decision`, { method: 'PATCH', token: hrToken, body: { status: 'APPROVED', comments: 'Take care.' } });
    assert.equal(decision.status, 200);
    assert.equal(decision.data.leave.status, 'APPROVED');

    const myLeaves = await request('/api/leaves', { token: employeeToken });
    assert.ok(myLeaves.data.leaves.some((leave) => leave.id === requested.data.leave.id && leave.reviewerComments === 'Take care.'));

    // Verify employee received notification for approved leave
    const notifs = await request('/api/notifications', { token: employeeToken });
    assert.equal(notifs.status, 200);
    assert.ok(notifs.data.notifications.some(n => n.type === 'LEAVE_APPROVED'));
  });
});

test('only admins can maintain payroll and profile updates work', async () => {
  await withApp(true, async (request) => {
    const employeeToken = await login(request, 'employee@dayflow.local', 'Employee!123');
    const forbidden = await request('/api/payroll', { token: employeeToken });
    assert.equal(forbidden.status, 403);

    // Profile update
    const profileUpdate = await request('/api/profile', { method: 'PATCH', token: employeeToken, body: { phone: '+91 99999 88888', address: 'Updated City' } });
    assert.equal(profileUpdate.status, 200);
    assert.equal(profileUpdate.data.profile.phone, '+91 99999 88888');

    // Password change
    const pwChange = await request('/api/auth/change-password', { method: 'POST', token: employeeToken, body: { currentPassword: 'Employee!123', newPassword: 'NewEmployee!999' } });
    assert.equal(pwChange.status, 200);
    const reLogin = await login(request, 'employee@dayflow.local', 'NewEmployee!999');
    assert.ok(reLogin);

    const adminToken = await login(request, 'admin@dayflow.local', 'Admin!12345');
    const employees = await request('/api/employees', { token: adminToken });
    const employee = employees.data.employees.find((item) => item.email === 'employee@dayflow.local');
    const saved = await request(`/api/payroll/${employee.id}`, { method: 'PUT', token: adminToken, body: { payPeriod: '2026-08', salaryCents: 7300000, basicCents: 6100000, allowanceCents: 1300000, deductionCents: 100000 } });
    assert.equal(saved.status, 200);
    const payroll = await request('/api/payroll/me', { token: employeeToken });
    assert.equal(payroll.status, 200);
    assert.equal(payroll.data.salaryCents, 7300000);
    assert.ok(payroll.data.records.some((record) => record.payPeriod === '2026-08' && record.netCents === 7300000));
  });
});

test('SPA route fallback serves index.html for application routes', async () => {
  await withApp(true, async (request) => {
    const routes = ['/dashboard', '/attendance', '/leave', '/payroll', '/employees', '/notifications', '/profile', '/settings', '/login'];
    for (const r of routes) {
      const res = await request(r);
      assert.equal(res.status, 200);
      assert.ok(res.contentType.includes('text/html'));
      assert.ok(res.data.includes('Dayflow'));
    }
  });
});

test('Vercel serverless entrypoint and default exports satisfy runtime contract', async () => {
  const vercelHandler = (await import('../api/index.js')).default;
  const serverHandler = (await import('../src/server.js')).default;
  assert.equal(typeof vercelHandler, 'function', 'api/index.js must export a default function');
  assert.equal(typeof serverHandler, 'function', 'src/server.js must export a default function');
});

