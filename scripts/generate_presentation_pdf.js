import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outputPath = resolve(__dirname, '../docs/Dayflow_HRMS_Video_Presentation_Guide.pdf');

try {
  mkdirSync(dirname(outputPath), { recursive: true });
} catch {}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
  autoFirstPage: true,
});

const writeStream = createWriteStream(outputPath);
doc.pipe(writeStream);

// Color Palette
const PRIMARY = '#4338CA';
const SECONDARY = '#0284C7';
const ACCENT = '#A21CAF';
const DARK = '#0F172A';
const MUTED = '#475569';
const BG_LIGHT = '#F8FAFC';
const BG_ACCENT = '#FDF4FF';
const BORDER = '#CBD5E1';

// Helper: Header Banner
doc.rect(45, 40, doc.page.width - 90, 4).fill(PRIMARY);
doc.moveDown(0.6);

doc.font('Helvetica-Bold').fontSize(18).fillColor(DARK).text('Dayflow HRMS — Official 5-Minute Demo Script & Guide', { align: 'left' });
doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Complete Step-by-Step Screen Recording Actions, Timing & Word-for-Word Voiceover Script', { align: 'left' });
doc.moveDown(0.6);

// Metadata Box
doc.rect(45, doc.y, doc.page.width - 90, 68).fillAndStroke(BG_LIGHT, BORDER);
const metaTop = doc.y + 8;

doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK);
doc.text('Project: ', 55, metaTop, { continued: true }).font('Helvetica').fillColor(MUTED).text('Dayflow HRMS (Odoo Hackathon 2026)');
doc.font('Helvetica-Bold').fillColor(DARK).text('Developer: ', 55, metaTop + 14, { continued: true }).font('Helvetica').fillColor(MUTED).text('Kavish (@jonekavish-dot — jonekavish@gmail.com)');
doc.font('Helvetica-Bold').fillColor(DARK).text('Live Vercel URL: ', 55, metaTop + 28, { continued: true }).font('Helvetica').fillColor(PRIMARY).text('https://dayflow-peach.vercel.app');
doc.font('Helvetica-Bold').fillColor(DARK).text('Local URL: ', 55, metaTop + 42, { continued: true }).font('Helvetica').fillColor(MUTED).text('http://localhost:3000');

doc.font('Helvetica-Bold').fillColor(DARK).text('Target Duration: ', 320, metaTop, { continued: true }).font('Helvetica').fillColor(MUTED).text('Exactly 5:00 Minutes (300 Seconds)');
doc.font('Helvetica-Bold').fillColor(DARK).text('Architecture: ', 320, metaTop + 14, { continued: true }).font('Helvetica').fillColor(MUTED).text('Dual-Engine (SQLite Offline + PostgreSQL Cloud)');
doc.font('Helvetica-Bold').fillColor(DARK).text('Test Suite: ', 320, metaTop + 28, { continued: true }).font('Helvetica').fillColor(MUTED).text('6/6 Integration Tests Passing (node --test)');
doc.font('Helvetica-Bold').fillColor(DARK).text('UI Style: ', 320, metaTop + 42, { continued: true }).font('Helvetica').fillColor(MUTED).text('Glassmorphism (Dark Cosmic & Light Mode)');

doc.y = metaTop + 62;
doc.moveDown(0.8);

// Part 1: Checklist
doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY).text('1. Recording Setup & Best Practices');
doc.moveDown(0.3);

const checklist = [
  'Screen Resolution: Set monitor / browser to 1080p (1920x1080) Full Screen (Press F11 in Chrome/Edge).',
  'Browser Cleanliness: Hide bookmarks bar (Ctrl + Shift + B) and start at http://localhost:3000 on the Animated Intro screen.',
  'Recording Tools: Windows Game Bar (Win + Alt + R), OBS Studio, or Loom with headset microphone.',
  'Pacing: Speak clearly and naturally. Allow 1-2 seconds after clicking for smooth UI animations to settle.',
];

doc.font('Helvetica').fontSize(9).fillColor(DARK);
checklist.forEach((item) => {
  doc.text(`•  ${item}`, { indent: 10, lineGap: 2 });
});
doc.moveDown(0.6);

// Part 2: Timeline Table
doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY).text('2. 5-Minute Master Timeline Overview');
doc.moveDown(0.4);

const timelineData = [
  ['0:00 – 0:45 (45s)', 'Scene 1: Intro Hero & Glassmorphism Design', 'Glowing bezier paths, CTA button, Dark/Light theme toggle.'],
  ['0:45 – 1:40 (55s)', 'Scene 2: Signup & 6-Digit Email Verification', 'Scrypt password hashing, 6-digit dev token, 1-click clipboard copy.'],
  ['1:40 – 2:35 (55s)', 'Scene 3: Employee Flow & Attendance Logging', 'Live monospace clock, check-in/out, annual leave quota gauge.'],
  ['2:35 – 3:30 (55s)', 'Scene 4: HR Command Center & Directory', 'Attendance rate meter, leave approvals, searchable employee modal.'],
  ['3:30 – 4:15 (45s)', 'Scene 5: Admin Portal & Payroll Processing', 'Salary adjustments, allowance/deduction calc, notification dispatch.'],
  ['4:15 – 4:45 (30s)', 'Scene 6: Notifications & SPA Deep-Linking', 'Unread alert center, browser Back/Forward, anti-flicker reload.'],
  ['4:45 – 5:00 (15s)', 'Scene 7: Dual-Engine DB & Wrap-Up', 'SQLite local-first + PostgreSQL cloud, 6/6 test pass, closing.'],
];

const startY = doc.y;
const rowHeight = 20;
const col1 = 50, col2 = 160, col3 = 340;

doc.rect(45, startY, doc.page.width - 90, 18).fill(BG_LIGHT);
doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK);
doc.text('Timestamp', col1, startY + 4);
doc.text('Scene & Focus Area', col2, startY + 4);
doc.text('Key Highlight Demonstrated', col3, startY + 4);

let currentY = startY + 18;
doc.font('Helvetica').fontSize(8).fillColor(DARK);

timelineData.forEach((row, i) => {
  if (i % 2 === 1) doc.rect(45, currentY, doc.page.width - 90, rowHeight).fill('#FAFAFA');
  doc.rect(45, currentY, doc.page.width - 90, rowHeight).stroke(BORDER);
  doc.font('Helvetica-Bold').fillColor(DARK).text(row[0], col1, currentY + 4);
  doc.font('Helvetica').fillColor(DARK).text(row[1], col2, currentY + 4);
  doc.font('Helvetica').fillColor(MUTED).text(row[2], col3, currentY + 4, { width: 190 });
  currentY += rowHeight;
});

doc.y = currentY + 15;

// Helper function to print Scene Cards
function printScene(title, time, actions, voiceover) {
  if (doc.y > 640) doc.addPage();

  const cardY = doc.y;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY).text(`${title}  `, 45, cardY, { continued: true });
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text(`[ ${time} ]`);
  doc.moveDown(0.3);

  // Actions
  doc.rect(45, doc.y, doc.page.width - 90, actions.length * 13 + 14).fillAndStroke(BG_LIGHT, BORDER);
  const actTop = doc.y + 6;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SECONDARY).text('🖥️ Visual Actions on Screen:', 52, actTop);
  doc.font('Helvetica').fontSize(8).fillColor(DARK);
  let actY = actTop + 12;
  actions.forEach((act) => {
    doc.text(`•  ${act}`, 54, actY, { width: doc.page.width - 110, lineGap: 1 });
    actY += 12;
  });

  doc.y = actY + 6;
  doc.moveDown(0.3);

  // Voiceover
  const voiceHeight = doc.heightOfString(`"${voiceover}"`, { width: doc.page.width - 115, lineGap: 2 });
  doc.rect(45, doc.y, doc.page.width - 90, voiceHeight + 20).fillAndStroke(BG_ACCENT, '#F0ABFC');
  const voiceTop = doc.y + 6;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(ACCENT).text('🗣️ Word-for-Word Voiceover Script:', 52, voiceTop);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#4A044E').text(`"${voiceover}"`, 54, voiceTop + 12, { width: doc.page.width - 115, lineGap: 2 });

  doc.y = voiceTop + 14 + voiceHeight + 10;
  doc.moveDown(0.6);
}

// Scene 1
printScene(
  'Scene 1: Introduction & Animated Hero Landing',
  '0:00 – 0:45 (45s)',
  [
    'Start at http://localhost:3000 on the Animated Intro hero screen.',
    'Hover smoothly over the glowing animated bezier background curves and gradient orb.',
    'Click the Sun/Moon theme switcher in topbar to toggle Light Mode and Dark Mode.',
    'Click the pulsing "Enter to Continue →" button (or press Enter) to transition to /login.',
    'Highlight the 1-Click Quick Login buttons (Admin, HR Officer, Employee) on the split-screen.',
  ],
  'Hello judges and hackathon evaluation team! Welcome to Dayflow HRMS — an ultra-modern, local-first Human Resource Management System built for the Odoo Hackathon 2026. In most enterprises, HR systems are sluggish, cluttered, and burdened by heavy framework bloat. Dayflow was engineered from the ground up to be ultra-fast, zero-dependency, and local-first — while delivering a stunning, SaaS-grade Glassmorphism experience. Notice our dynamic intro screen with glowing bezier curves and our instant dark-to-light theme engine. Let’s enter the portal and see how Dayflow transforms the HR experience!'
);

// Scene 2
printScene(
  'Scene 2: New User Signup & 6-Digit Email Verification',
  '0:45 – 1:40 (55s)',
  [
    'On /login, click "Sign Up" (SPA cleanly transitions to /signup without full reload).',
    'Fill registration: Jordan Lee | DF-TEST-777 | jordan.lee@example.com | ValidPassword!123 | Employee.',
    'Click "Create Account" → router navigates directly to /verify.',
    'Point out the 6-Digit Verification Code displayed on screen. Click the 1-Click "Copy Code" button.',
    'Paste the 6-digit code into input and click "Verify Email" → observe green success toast and redirect to /login.',
  ],
  'Security and verification are core to Dayflow. Let’s register a brand-new employee account. Our backend utilizes strong scrypt password hashing with cryptographic salts and strict input validation. Notice how client-side SPA routing transitions to /signup without a full page reload. Upon submitting, Dayflow issues a secure 6-digit email verification token with a 15-minute expiration timestamp. For judge testing convenience, the token is provided right on screen with a 1-click clipboard copy button. Once verified, the account is activated in the database, and we are ready to sign in.'
);

// Scene 3
printScene(
  'Scene 3: Employee Portal & Attendance Workflow',
  '1:40 – 2:35 (55s)',
  [
    'Click the green 🟢 Employee quick-login button (employee@dayflow.local).',
    'Highlight the Employee Dashboard: Live Monospace Digital Clock and Annual Leave Quota Gauge (X / 25 days).',
    'Navigate to Attendance (/attendance) → Click "Check In Now" (show timestamp recording and PRESENT badge).',
    'Navigate to Leave (/leave) → Submit paid leave: next Monday to Wednesday, remarks: "Attending annual tech conference".',
    'Click "Submit Request" → Show new request with yellow PENDING badge → Click "Sign Out" in sidebar.',
  ],
  'Let’s sign in as our seeded employee, Emery Patel, using our 1-click test button. The Employee Dashboard features a live digital clock synchronized with timezone boundaries, today’s attendance status, and a visual leave quota gauge showing remaining balance. Under Attendance, employees can log their check-ins with exact timestamp precision. Our system prevents duplicate check-ins and validates work hours. Now let’s apply for time off. The leave manager validates against overlapping requests and date errors. As soon as Emery submits this paid leave request, an alert is automatically dispatched to the HR team. Let’s log in as HR and approve it.'
);

// Scene 4
printScene(
  'Scene 4: HR Officer Command Center & Directory',
  '2:35 – 3:30 (55s)',
  [
    'Click the yellow 🟡 HR Officer quick-login button (hr@dayflow.local).',
    'Show Staff Dashboard: Live Company Attendance Rate Meter (gradient gauge) and present/absent counts.',
    'Navigate to Leave (/leave) → Locate Emery Patel’s pending request → Click "Approve".',
    'Add reviewer comment: "Approved. Please share conference notes upon return." → Confirm → Badge turns green APPROVED.',
    'Navigate to Employees (/employees) → Search "Engineering" → Click employee card to open Detailed Profile Modal → Sign Out.',
  ],
  'Switching to our HR Officer, Harper Rao. The Staff Dashboard immediately surfaces high-level workforce metrics — including a live company-wide attendance percentage meter, active employee counts, and pending approval queues. Under the Leave Command Center, HR has full visibility over company-wide requests. Here is Emery’s conference leave. HR can add personalized feedback and approve or reject in real time. In the Employee Directory, HR and Administrators can search and filter across departments, and click any profile to inspect or update contact info, job titles, and documentation.'
);

// Scene 5
printScene(
  'Scene 5: Admin Executive Portal & Payroll Processing',
  '3:30 – 4:15 (45s)',
  [
    'Click the red 🔴 Admin quick-login button (admin@dayflow.local).',
    'Navigate to Payroll (/payroll) → Show complete company payroll ledger with Basic, Allowances, Deductions, and Net CTC.',
    'Click "Edit Payroll" for employee → Set Basic: ₹70,000, Allowances: ₹15,000, Deductions: ₹2,500.',
    'Click "Save Payroll" → Show success toast alert ("Payroll updated successfully").',
    'Navigate to Settings (/settings) → Show session diagnostics & RBAC permissions → Sign Out.',
  ],
  'Now logging in as Avery Admin to demonstrate executive controls. Under Payroll Management, administrators have full compensation oversight. Dayflow automatically computes net CTC from basic pay, custom allowances, and statutory deductions. When an admin adjusts or processes a monthly payroll record, Dayflow updates the ledger with atomic transactions and automatically dispatches a confidential notification to that employee. The Settings portal provides session security audits and direct password management with RBAC enforcement.'
);

// Scene 6
printScene(
  'Scene 6: In-App Notifications & SPA Deep-Linking',
  '4:15 – 4:45 (30s)',
  [
    'Log back in as 🟢 Employee (employee@dayflow.local).',
    'Point out the unread notification badge count in the topbar and sidebar.',
    'Click "Notifications" (/notifications) → Show Leave Approved and Payroll Updated notifications.',
    'Click "Mark All as Read" button.',
    'Test Browser History: Click browser Back button, Forward button, then press Ctrl + R to demonstrate zero-flicker reload.',
  ],
  'Back in Emery’s portal, the notification center has received real-time updates for both the approved leave and the updated payroll slip. Notice our robust client-side architecture: clicking the browser’s Back and Forward buttons navigates through browser history seamlessly. Deep-linking directly to any route or refreshing the page preserves authentication and view state with zero layout flicker.'
);

// Scene 7
printScene(
  'Scene 7: Dual-Engine Architecture & Closing',
  '4:45 – 5:00 (15s)',
  [
    'Show terminal running node --test (6/6 tests passing in 1.6s) or browser at https://dayflow-peach.vercel.app.',
    'Return to Dayflow animated hero landing screen and end on the clean branding.',
  ],
  'Under the hood, Dayflow is powered by a Dual-Engine Database Abstraction Layer. Locally, it runs 100% offline using native Node.js and SQLite with zero external dependencies. In production on Vercel, it connects seamlessly to serverless PostgreSQL with connection pooling and SSL. With 6/6 automated integration tests passing and zero framework bloat, Dayflow HRMS represents the future of fast, elegant, and local-first enterprise software. Thank you for watching!'
);

// Pro Tips Box
if (doc.y > 660) doc.addPage();
doc.rect(45, doc.y, doc.page.width - 90, 52).fillAndStroke('#ECFDF5', '#A7F3D0');
const tipTop = doc.y + 6;
doc.font('Helvetica-Bold').fontSize(9).fillColor('#047857').text('🏆 Pro Hackathon Presentation Tips:', 52, tipTop);
doc.font('Helvetica').fontSize(8).fillColor(DARK);
doc.text('1. Cursor Discipline: Avoid rapid erratic mouse circles. Click deliberately and let each screen view settle for 1 second.', 54, tipTop + 12);
doc.text('2. 1-Click Testing: Leverage the colored login buttons on /login to switch roles in under 2 seconds during the demo.', 54, tipTop + 24);
doc.text('3. Highlight Native Standards: Emphasize Vanilla JS, Native Node.js, and zero heavy npm framework bloat.', 54, tipTop + 36);

// Footer & Page Numbers
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED);
  doc.text(
    `Dayflow HRMS • 5-Minute Video Presentation Master Guide • Page ${i + 1} of ${totalPages}`,
    45,
    doc.page.height - 28,
    { align: 'center', width: doc.page.width - 90 }
  );
}

doc.end();

writeStream.on('finish', () => {
  console.log(`PDF successfully generated at: ${outputPath}`);
});
