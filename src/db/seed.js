import { randomUUID } from 'node:crypto';
import { hashPassword } from '../auth.js';
import { getDatabase } from './index.js';

export async function seedDemoData(db) {
  const result = await db.get('SELECT COUNT(*) AS count FROM users');
  const count = Number(result?.count || 0);
  if (count > 0) return;

  const addUser = async (empId, userEmail, role, pw, name, phone, address, dept, title, startDate, salary) => {
    const id = randomUUID();
    await db.run(
      'INSERT INTO users (id, employee_id, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, 1)',
      [id, empId, userEmail, hashPassword(pw), role]
    );
    await db.run(
      'INSERT INTO employee_profiles (user_id, full_name, phone, address, department, job_title, start_date, salary_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, address, dept, title, startDate, salary]
    );
    return id;
  };

  const adminId  = await addUser('DF-ADMIN-001', 'admin@dayflow.local',    'ADMIN',    'Admin!12345',   'Avery Admin',  '+91 98765 43210', 'Mumbai, India',     'Operations',  'HR Director',       '2024-01-15', 12500000);
  const hrId     = await addUser('DF-HR-001',    'hr@dayflow.local',       'HR',       'Hr!12345678',   'Harper Rao',   '+91 98765 43211', 'Bengaluru, India',  'People',      'HR Officer',        '2024-06-01', 8500000);
  const emp1Id   = await addUser('DF-EMP-001',   'employee@dayflow.local', 'EMPLOYEE', 'Employee!123',  'Emery Patel',  '+91 90000 00001', 'Bengaluru, India',  'Engineering', 'Software Engineer', '2025-01-15', 7200000);
  const emp2Id   = await addUser('DF-EMP-002',   'priya@dayflow.local',    'EMPLOYEE', 'Employee!123',  'Priya Sharma', '+91 90000 00002', 'Hyderabad, India',  'Design',      'UI/UX Designer',    '2025-03-01', 6800000);
  const emp3Id   = await addUser('DF-EMP-003',   'arjun@dayflow.local',    'EMPLOYEE', 'Employee!123',  'Arjun Mehta',  '+91 90000 00003', 'Delhi, India',      'Marketing',   'Marketing Manager', '2024-11-01', 7500000);
  const emp4Id   = await addUser('DF-EMP-004',   'neha@dayflow.local',     'EMPLOYEE', 'Employee!123',  'Neha Gupta',   '+91 90000 00004', 'Pune, India',       'Engineering', 'Backend Developer', '2025-02-15', 7000000);

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const period    = today.slice(0, 7);
  const dayAfter  = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

  // --- Attendance today ---
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status, notes) VALUES (?, ?, ?, ?, ?, 'PRESENT', ?)",
    [randomUUID(), emp1Id, today, `${today}T09:08:00.000Z`, `${today}T17:42:00.000Z`, 'Regular workday']);
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, status, notes) VALUES (?, ?, ?, ?, 'PRESENT', ?)",
    [randomUUID(), emp2Id, today, `${today}T09:30:00.000Z`, 'Working remotely']);
  await db.run("INSERT INTO attendance (id, employee_id, work_date, status, notes) VALUES (?, ?, ?, 'LEAVE', ?)",
    [randomUUID(), emp4Id, today, 'On approved sick leave']);

  // --- Attendance yesterday ---
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')",
    [randomUUID(), emp1Id, yesterday, `${yesterday}T09:15:00.000Z`, `${yesterday}T18:00:00.000Z`]);
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')",
    [randomUUID(), emp2Id, yesterday, `${yesterday}T09:45:00.000Z`, `${yesterday}T17:30:00.000Z`]);
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')",
    [randomUUID(), emp3Id, yesterday, `${yesterday}T10:00:00.000Z`, `${yesterday}T17:00:00.000Z`]);
  await db.run("INSERT INTO attendance (id, employee_id, work_date, check_in_at, check_out_at, status) VALUES (?, ?, ?, ?, ?, 'PRESENT')",
    [randomUUID(), emp4Id, yesterday, `${yesterday}T09:00:00.000Z`, `${yesterday}T17:45:00.000Z`]);

  // --- Leave requests ---
  const leave1 = randomUUID();
  await db.run("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'PAID', ?, ?, ?, 'APPROVED', ?, ?, CURRENT_TIMESTAMP)",
    [leave1, emp1Id, dayAfter(-7), dayAfter(-5), 'Family function', hrId, 'Approved. Enjoy!']);
  const leave2 = randomUUID();
  await db.run("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status) VALUES (?, ?, 'SICK', ?, ?, ?, 'PENDING')",
    [leave2, emp2Id, dayAfter(7), dayAfter(9), 'Medical appointment and follow-up']);
  const leave3 = randomUUID();
  await db.run("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'UNPAID', ?, ?, ?, 'REJECTED', ?, ?, CURRENT_TIMESTAMP)",
    [leave3, emp3Id, dayAfter(-7), dayAfter(-5), 'Personal work', adminId, 'Please reschedule to next month.']);
  const leave4 = randomUUID();
  await db.run("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status, reviewer_id, reviewer_comments, decided_at) VALUES (?, ?, 'SICK', ?, ?, ?, 'APPROVED', ?, ?, CURRENT_TIMESTAMP)",
    [leave4, emp4Id, today, today, 'Not feeling well', hrId, 'Get well soon!']);
  const leave5 = randomUUID();
  await db.run("INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, remarks, status) VALUES (?, ?, 'PAID', ?, ?, ?, 'PENDING')",
    [leave5, emp1Id, dayAfter(14), dayAfter(16), 'Planned vacation']);

  // --- Payroll records ---
  await db.run('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), emp1Id, period, 6000000, 1500000, 200000]);
  await db.run('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), emp2Id, period, 5600000, 1400000, 180000]);
  await db.run('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), emp3Id, period, 6200000, 1600000, 250000]);
  await db.run('INSERT INTO payroll_records (id, employee_id, pay_period, basic_cents, allowance_cents, deduction_cents) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), emp4Id, period, 5800000, 1450000, 200000]);

  // --- Notifications ---
  const notify = (uid, type, title, msg, rel) =>
    db.run('INSERT INTO notifications (id, user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), uid, type, title, msg, rel]);

  await notify(emp1Id, 'LEAVE_APPROVED', 'Leave Approved',  'Your paid leave request has been approved by Harper Rao.', leave1);
  await notify(emp3Id, 'LEAVE_REJECTED', 'Leave Rejected',  'Your unpaid leave request has been rejected. Please reschedule to next month.', leave3);
  await notify(emp4Id, 'LEAVE_APPROVED', 'Leave Approved',  'Your sick leave request has been approved by Harper Rao.', leave4);
  await notify(hrId,   'LEAVE_SUBMITTED','New Leave Request','Priya Sharma submitted a sick leave request.', leave2);
  await notify(hrId,   'LEAVE_SUBMITTED','New Leave Request','Emery Patel submitted a paid leave request.', leave5);
  await notify(adminId,'LEAVE_SUBMITTED','New Leave Request','Priya Sharma submitted a sick leave request.', leave2);
  await notify(adminId,'LEAVE_SUBMITTED','New Leave Request','Emery Patel submitted a paid leave request.', leave5);
  await notify(emp1Id, 'PAYROLL',        'Payroll Processed',`Your payroll for ${period} has been processed.`, null);
  await notify(emp2Id, 'PAYROLL',        'Payroll Processed',`Your payroll for ${period} has been processed.`, null);
}

// Support direct execution: node src/db/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const db = await getDatabase();
  console.log(`Seeding database using ${db.type} backend...`);
  await seedDemoData(db);
  console.log('Database seeding complete!');
  await db.close();
}
