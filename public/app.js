/**
 * Dayflow HRMS - Client-Side Routing & SPA Engine
 */

// Application State
const state = {
  token: localStorage.getItem('dayflowToken'),
  user: null,
  currentPath: window.location.pathname,
  employees: [],
  selectedWeek: localDay(),
  notifications: [],
  unreadCount: 0,
  filterDept: 'ALL',
  searchQuery: '',
};

// DOM Shorthands
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const view = $('#view');

// SVG Icon Library
const icons = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  profile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  attendance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  leaves: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  payroll: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  employees: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  notifications: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
};

// Utilities
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const money = (cents) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100);
const dateText = (val) => val ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${val.slice(0, 10)}T12:00:00`)) : '—';
const timeText = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

function localDay() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function badge(status) {
  const norm = String(status || '').toLowerCase();
  return `<span class="badge badge-${norm}"><span class="badge-dot"></span>${esc(status.replace('_', ' '))}</span>`;
}

// Toast System
function toast(message, type = 'info') {
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${esc(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 4000);
}

function showAlert(target, type, message) {
  target.textContent = message;
  target.className = `alert show ${type}`;
}

function clearAlert(target) {
  target.textContent = '';
  target.className = 'alert';
}

// Modal System
function openModal({ title, body, footer }) {
  $('#modal-header').innerHTML = `<h3>${esc(title)}</h3><button class="icon-btn" onclick="closeModal()">&times;</button>`;
  $('#modal-body').innerHTML = body;
  $('#modal-footer').innerHTML = footer || `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
  $('#modal-overlay').hidden = false;
}

window.closeModal = function() {
  $('#modal-overlay').hidden = true;
};

// API Client Wrapper
async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

// ==========================================================================
// CLIENT-SIDE ROUTER ENGINE (HTML5 History API)
// ==========================================================================

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Directory',
  '/attendance': 'Attendance Management',
  '/leave': 'Leave & Time Off',
  '/payroll': 'Payroll & Compensation',
  '/notifications': 'Notification Center',
  '/profile': 'My Profile',
  '/settings': 'Account Settings',
  '/login': 'Sign in — Dayflow HRMS',
  '/signup': 'Create Account — Dayflow HRMS',
  '/verify': 'Verify Email — Dayflow HRMS',
};

// Global navigate function
window.navigateTo = function(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
  handleRoute();
};

window.addEventListener('popstate', () => {
  handleRoute();
});

// Intercept all route clicks on document
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-route]');
  if (target) {
    e.preventDefault();
    const route = target.dataset.route;
    navigateTo(route);
  }
});

async function handleRoute() {
  let path = window.location.pathname;
  if (path === '/') path = state.token ? '/dashboard' : '/login';

  state.currentPath = path;

  // Unauthenticated user flow
  if (!state.token) {
    if (path === '/signup' || path === '/register') {
      showAuthScreen('register');
      return;
    }
    if (path === '/verify') {
      showAuthScreen('verify');
      return;
    }
    // Default unauthenticated is login
    if (path !== '/login') {
      navigateTo('/login', true);
      return;
    }
    showAuthScreen('login');
    return;
  }

  // Authenticated user trying to access login/signup/verify -> redirect to dashboard
  if (path === '/login' || path === '/signup' || path === '/register' || path === '/verify') {
    navigateTo('/dashboard', true);
    return;
  }

  // Ensure user state is loaded
  if (!state.user) {
    try {
      const res = await api('/api/auth/me');
      state.user = res.user;
    } catch {
      localStorage.removeItem('dayflowToken');
      state.token = null;
      navigateTo('/login', true);
      return;
    }
  }

  // Enter application shell
  $('#auth-shell').hidden = true;
  $('#app-shell').hidden = false;

  const initials = state.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  $('#user-avatar').textContent = initials;
  $('#user-name').textContent = state.user.fullName;

  // Render navigation & active item
  renderSidebarNav();
  await fetchNotifications();

  // Apply saved sidebar preference on desktop / close on mobile
  if (window.innerWidth > 860 && localStorage.getItem('dayflowSidebarCollapsed') === 'true') {
    closeSidebar(false);
  } else if (window.innerWidth <= 860) {
    closeSidebar(false);
  }

  // Route Dispatcher
  clearAlert($('#app-message'));
  view.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-title">Loading...</div></div></div>`;

  // Dynamic parameterized routes: /employees/:id
  const empDetailMatch = /^\/employees\/([^/]+)$/.exec(path);
  if (empDetailMatch) {
    if (state.user.role === 'EMPLOYEE') {
      renderAccessDenied('Only HR Officers and Administrators can view individual employee profiles.');
      return;
    }
    $('#page-title').textContent = 'Employee Details';
    document.title = `Employee Details — Dayflow HRMS`;
    await renderEmployeeDetail(empDetailMatch[1]);
    return;
  }

  // Set page heading & document title
  $('#page-title').textContent = routeTitles[path] || 'Dayflow HRMS';
  document.title = `${routeTitles[path] || 'Dayflow'} — Dayflow HRMS`;

  // Standard Routes
  switch (path) {
    case '/dashboard':
      await renderDashboard();
      break;
    case '/employees':
      if (state.user.role === 'EMPLOYEE') {
        renderAccessDenied('You do not have permission to view the employee directory.');
        return;
      }
      await renderEmployees();
      break;
    case '/attendance':
      await renderAttendanceModule();
      break;
    case '/leave':
      await renderLeaveModule();
      break;
    case '/payroll':
      await renderPayrollModule();
      break;
    case '/notifications':
      await renderNotificationsPage();
      break;
    case '/profile':
      await renderProfile();
      break;
    case '/settings':
      await renderSettings();
      break;
    default:
      render404();
      break;
  }
}

function renderAccessDenied(msg) {
  $('#page-title').textContent = 'Access Denied';
  view.innerHTML = `
    <div class="card">
      <div class="empty-state">
        <div class="empty-state-icon" style="color:var(--danger);">⚠️</div>
        <div class="empty-state-title" style="color:var(--danger);">Access Restricted</div>
        <p class="empty-state-desc">${esc(msg)}</p>
        <button class="btn btn-primary" style="margin-top:1.25rem;" onclick="navigateTo('/dashboard')">Return to Dashboard</button>
      </div>
    </div>
  `;
}

function render404() {
  $('#page-title').textContent = 'Page Not Found';
  view.innerHTML = `
    <div class="card">
      <div class="empty-state">
        <div class="empty-state-icon">🧭</div>
        <div class="empty-state-title">404 — Page Not Found</div>
        <p class="empty-state-desc">The requested route <code>${esc(window.location.pathname)}</code> does not exist.</p>
        <button class="btn btn-primary" style="margin-top:1.25rem;" onclick="navigateTo('/dashboard')">Go to Dashboard</button>
      </div>
    </div>
  `;
}

// ==========================================================================
// Authentication Handlers
// ==========================================================================
function showAuthScreen(name) {
  $('#app-shell').hidden = true;
  $('#auth-shell').hidden = false;
  ['login', 'register', 'verify'].forEach((id) => {
    $(`#${id}-form`).hidden = id !== name;
  });
  clearAlert($('#auth-message'));
  $('#dev-code-box').innerHTML = '';
  document.title = name === 'login' ? 'Sign in — Dayflow' : name === 'register' ? 'Sign up — Dayflow' : 'Verify — Dayflow';
}

$$('[data-auth-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.authView;
    if (v === 'login') navigateTo('/login');
    else if (v === 'register') navigateTo('/signup');
    else if (v === 'verify') navigateTo('/verify');
  });
});

// Password Show/Hide Toggle
$$('.pw-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = $(`#${btn.dataset.target}`);
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'Hide';
    } else {
      input.type = 'password';
      btn.textContent = 'Show';
    }
  });
});

// Quick Login Testing Helpers
const demoCredentials = {
  admin: { email: 'admin@dayflow.local', password: 'Admin!12345' },
  hr: { email: 'hr@dayflow.local', password: 'Hr!12345678' },
  employee: { email: 'employee@dayflow.local', password: 'Employee!123' },
};

$$('[data-quick]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const creds = demoCredentials[btn.dataset.quick];
    if (creds) {
      $('#login-form [name=email]').value = creds.email;
      $('#login-form [name=password]').value = creds.password;
      $('#login-form').requestSubmit();
    }
  });
});

// Auth Form Submissions
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert($('#auth-message'));
  try {
    const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(formObject(e.currentTarget)) });
    state.token = res.token;
    state.user = res.user;
    localStorage.setItem('dayflowToken', res.token);
    toast(`Welcome back, ${res.user.fullName}!`, 'success');
    navigateTo('/dashboard');
  } catch (err) {
    showAlert($('#auth-message'), 'error', err.message);
  }
});

$('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert($('#auth-message'));
  try {
    const payload = formObject(e.currentTarget);
    const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    $('#verify-form [name=email]').value = payload.email;
    navigateTo('/verify');
    showAlert($('#auth-message'), 'info', res.message);
    $('#dev-code-box').innerHTML = `
      <div class="dev-code-card">
        <div>
          <div style="font-size:0.75rem; font-weight:700; color:#1e40af; text-transform:uppercase;">Local Dev Verification Code</div>
          <div class="dev-code-val">${esc(res.developmentVerificationCode)}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${res.developmentVerificationCode}'); toast('Code copied!', 'success');">Copy</button>
      </div>`;
  } catch (err) {
    showAlert($('#auth-message'), 'error', err.message);
  }
});

$('#verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert($('#auth-message'));
  try {
    const res = await api('/api/auth/verify-email', { method: 'POST', body: JSON.stringify(formObject(e.currentTarget)) });
    navigateTo('/login');
    showAlert($('#auth-message'), 'success', res.message);
  } catch (err) {
    showAlert($('#auth-message'), 'error', err.message);
  }
});

$('#logout-btn').addEventListener('click', () => {
  localStorage.removeItem('dayflowToken');
  state.token = null;
  state.user = null;
  toast('Signed out successfully.', 'info');
  navigateTo('/login');
});

// Sidebar Toggle & Collapse Handlers (Desktop & Mobile with localStorage persistence)
function closeSidebar(persist = true) {
  $('#sidebar').classList.add('closed');
  $('#sidebar').classList.remove('open');
  $('#app-shell').classList.add('sidebar-collapsed');
  $('#sidebar-overlay').classList.remove('open');
  if (persist && window.innerWidth > 860) {
    localStorage.setItem('dayflowSidebarCollapsed', 'true');
  }
}

function openSidebar(persist = true) {
  $('#sidebar').classList.remove('closed');
  $('#sidebar').classList.add('open');
  $('#app-shell').classList.remove('sidebar-collapsed');
  if (window.innerWidth <= 860) {
    $('#sidebar-overlay').classList.add('open');
  }
  if (persist && window.innerWidth > 860) {
    localStorage.setItem('dayflowSidebarCollapsed', 'false');
  }
}

function toggleSidebar() {
  const isClosed = $('#sidebar').classList.contains('closed') || (window.innerWidth <= 860 && !$('#sidebar').classList.contains('open'));
  if (isClosed) {
    openSidebar(true);
  } else {
    closeSidebar(true);
  }
}

$('#menu-btn').addEventListener('click', toggleSidebar);
$('#sidebar-close').addEventListener('click', () => closeSidebar(true));
$('#sidebar-overlay').addEventListener('click', () => closeSidebar(false));

// ==========================================================================
// Sidebar Navigation Component
// ==========================================================================
function getNavItems() {
  const common = [
    { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { path: '/attendance', label: 'Attendance', icon: icons.attendance },
    { path: '/leave', label: 'Leave', icon: icons.leaves },
    { path: '/payroll', label: 'Payroll', icon: icons.payroll },
  ];

  if (state.user.role !== 'EMPLOYEE') {
    common.splice(1, 0, { path: '/employees', label: 'Employees', icon: icons.employees });
  }

  common.push(
    { path: '/notifications', label: 'Notifications', icon: icons.notifications },
    { path: '/profile', label: 'My Profile', icon: icons.profile },
    { path: '/settings', label: 'Settings', icon: icons.settings }
  );

  return common;
}

function renderSidebarNav() {
  const items = getNavItems();
  const cur = state.currentPath.split('/')[1] ? `/${state.currentPath.split('/')[1]}` : '/dashboard';

  $('#sidebar-nav').innerHTML = items.map((item) => `
    <button class="sidebar-link ${item.path === cur ? 'active' : ''}" data-route="${item.path}">
      ${item.icon}
      <span>${item.label}</span>
    </button>
  `).join('');
}

// ==========================================================================
// Notifications System
// ==========================================================================
async function fetchNotifications() {
  try {
    const res = await api('/api/notifications');
    state.notifications = res.notifications || [];
    state.unreadCount = res.unreadCount || 0;
    const badgeEl = $('#notif-badge');
    if (state.unreadCount > 0) {
      badgeEl.textContent = state.unreadCount > 9 ? '9+' : state.unreadCount;
      badgeEl.hidden = false;
    } else {
      badgeEl.hidden = true;
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  }
}

$('#notif-btn').addEventListener('click', () => {
  navigateTo('/notifications');
});

async function renderNotificationsPage() {
  await fetchNotifications();

  view.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <div>
          <h2 class="card-title">Notification Center</h2>
          <p class="card-subtitle">${state.unreadCount} unread of ${state.notifications.length} total notifications</p>
        </div>
        ${state.unreadCount > 0 ? `<button class="btn btn-outline btn-sm" onclick="markAllNotificationsRead()">Mark all as read</button>` : ''}
      </div>

      ${state.notifications.length === 0
        ? `<div class="empty-state"><div class="empty-state-title">No notifications</div><p class="empty-state-desc">You're all caught up!</p></div>`
        : `<div style="display:flex; flex-direction:column; gap:0.25rem;">
            ${state.notifications.map((n) => `
              <div class="notif-item ${n.isRead ? '' : 'unread'}" id="notif-${n.id}">
                <div class="notif-icon ${n.type.includes('APPROVED') ? 'badge-approved' : n.type.includes('REJECTED') ? 'badge-rejected' : 'badge-leave'}">
                  ${n.type.includes('APPROVED') ? icons.check : n.type.includes('REJECTED') ? icons.x : icons.calendar}
                </div>
                <div style="flex-grow:1;">
                  <div class="notif-title">${esc(n.title)}</div>
                  <div class="notif-desc">${esc(n.message)}</div>
                  <div class="notif-time">${dateText(n.createdAt)}</div>
                </div>
                ${!n.isRead ? `<button class="btn btn-outline btn-sm" onclick="markSingleRead('${n.id}')">Mark read</button>` : ''}
              </div>
            `).join('')}
          </div>`
      }
    </div>
  `;
}

window.markSingleRead = async function(id) {
  try {
    await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
    toast('Marked as read.', 'info');
    await renderNotificationsPage();
  } catch (err) {
    toast(err.message, 'error');
  }
};

window.markAllNotificationsRead = async function() {
  try {
    await api('/api/notifications/read-all', { method: 'PATCH' });
    toast('All notifications marked as read.', 'success');
    await renderNotificationsPage();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ==========================================================================
// Route View: /dashboard
// ==========================================================================
async function renderDashboard() {
  const data = await api('/api/dashboard');

  if (data.kind === 'employee') {
    const att = data.attendance;
    const isCheckedIn = !!att;
    const isCheckedOut = !!att?.check_out_at;

    view.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Today's Status</span>
            <div class="metric-icon-wrap ${isCheckedIn ? 'green' : 'amber'}">${icons.attendance}</div>
          </div>
          <div class="metric-val" style="font-size:1.5rem;">${att ? badge(att.status) : '<span style="color:var(--text-muted); font-size:1.25rem;">Not Checked In</span>'}</div>
          <div class="metric-footer">${dateText(data.today)}</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Pending Leaves</span>
            <div class="metric-icon-wrap amber">${icons.leaves}</div>
          </div>
          <div class="metric-val">${data.pendingLeaves}</div>
          <div class="metric-footer">Active requests</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Approved Leaves</span>
            <div class="metric-icon-wrap green">${icons.leaves}</div>
          </div>
          <div class="metric-val">${data.approvedLeaves}</div>
          <div class="metric-footer">This year</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Annual Salary</span>
            <div class="metric-icon-wrap indigo">${icons.payroll}</div>
          </div>
          <div class="metric-val" style="font-size:1.5rem;">${money(data.salaryCents)}</div>
          <div class="metric-footer">Base CTC</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Today's Attendance</h2>
              <p class="card-subtitle">${dateText(data.today)}</p>
            </div>
          </div>
          <div class="attendance-widget">
            <div class="clock-display" id="live-clock">--:--:--</div>
            <div>
              ${isCheckedIn ? `<p style="font-weight:600; color:var(--text-main); margin-bottom:0.25rem;">Checked in at <strong>${timeText(att.check_in_at)}</strong></p>` : `<p>You have not checked in yet today.</p>`}
              ${isCheckedOut ? `<p style="font-weight:600; color:var(--text-main);">Checked out at <strong>${timeText(att.check_out_at)}</strong></p>` : ''}
            </div>
            <div class="attendance-actions">
              <button id="btn-checkin" class="btn btn-success btn-full" ${isCheckedIn ? 'disabled' : ''}>${icons.check} Check In</button>
              <button id="btn-checkout" class="btn btn-danger btn-full" ${!isCheckedIn || isCheckedOut ? 'disabled' : ''}>${icons.x} Check Out</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Leave Requests</h2>
            <button class="link-btn" onclick="navigateTo('/leave')">View all</button>
          </div>
          ${data.recentLeaves.length === 0
            ? `<div class="empty-state"><div class="empty-state-title">No recent leave requests</div><p class="empty-state-desc">Apply for time off using the Leave module.</p></div>`
            : `<div class="table-responsive"><table class="table">
                <thead><tr><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>${data.recentLeaves.map((l) => `
                  <tr>
                    <td><strong>${dateText(l.startDate)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">to ${dateText(l.endDate)}</span></td>
                    <td>${esc(l.leaveType)}</td>
                    <td>${badge(l.status)}</td>
                  </tr>
                `).join('')}</tbody>
              </table></div>`
          }
        </div>
      </div>
    `;

    startLiveClock();
    $('#btn-checkin')?.addEventListener('click', () => recordAttendanceAction('/api/attendance/check-in'));
    $('#btn-checkout')?.addEventListener('click', () => recordAttendanceAction('/api/attendance/check-out'));
    return;
  }

  // Staff Dashboard
  view.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Total Employees</span>
          <div class="metric-icon-wrap indigo">${icons.employees}</div>
        </div>
        <div class="metric-val">${data.totalEmployees}</div>
        <div class="metric-footer">Active workforce</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Present Today</span>
          <div class="metric-icon-wrap green">${icons.attendance}</div>
        </div>
        <div class="metric-val">${data.presentToday}</div>
        <div class="metric-footer">${Math.round((data.presentToday / (data.totalEmployees || 1)) * 100)}% attendance rate</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Absent Today</span>
          <div class="metric-icon-wrap red">${icons.x}</div>
        </div>
        <div class="metric-val">${data.absentToday}</div>
        <div class="metric-footer">Unaccounted</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">On Leave</span>
          <div class="metric-icon-wrap blue">${icons.leaves}</div>
        </div>
        <div class="metric-val">${data.onLeaveToday}</div>
        <div class="metric-footer">Approved leaves</div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Pending Requests</span>
          <div class="metric-icon-wrap amber">${icons.leaves}</div>
        </div>
        <div class="metric-val">${data.pendingLeaves}</div>
        <div class="metric-footer"><a href="javascript:navigateTo('/leave')" style="color:var(--primary); font-weight:600;">Requires review</a></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Recent Organisation Leave Activity</h2>
          <p class="card-subtitle">Latest requests submitted by staff members</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="navigateTo('/leave')">Manage Approvals</button>
      </div>
      ${data.recentLeaves.length === 0
        ? `<div class="empty-state"><div class="empty-state-title">No recent leave requests</div></div>`
        : `<div class="table-responsive"><table class="table">
            <thead><tr><th>Employee</th><th>Dates</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${data.recentLeaves.map((l) => `
              <tr>
                <td><strong>${esc(l.employeeName)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${esc(l.employeeCode)}</span></td>
                <td>${dateText(l.startDate)} &rarr; ${dateText(l.endDate)}</td>
                <td>${esc(l.leaveType)}</td>
                <td>${badge(l.status)}</td>
                <td>${l.status === 'PENDING' ? `<button class="btn btn-outline btn-sm" onclick="decideLeavePrompt('${l.id}', 'APPROVED')">Approve</button>` : `<span style="font-size:0.8rem; color:var(--text-muted);">Decided</span>`}</td>
              </tr>
            `).join('')}</tbody>
          </table></div>`
      }
    </div>
  `;
}

function startLiveClock() {
  const clockEl = $('#live-clock');
  if (!clockEl) return;
  const update = () => {
    if ($('#live-clock')) {
      $('#live-clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };
  update();
  setInterval(update, 1000);
}

async function recordAttendanceAction(path) {
  try {
    await api(path, { method: 'POST', body: '{}' });
    toast(path.endsWith('check-in') ? 'Checked in successfully!' : 'Checked out successfully!', 'success');
    await handleRoute();
  } catch (err) {
    showAlert($('#app-message'), 'error', err.message);
  }
}

// ==========================================================================
// Route View: /employees & /employees/:id
// ==========================================================================
async function renderEmployees() {
  const { employees } = await api('/api/employees');
  state.employees = employees;

  const departments = ['ALL', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter((e) => {
    const matchDept = state.filterDept === 'ALL' || e.department === state.filterDept;
    const matchSearch = !state.searchQuery || e.fullName.toLowerCase().includes(state.searchQuery.toLowerCase()) || e.employeeId.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchDept && matchSearch;
  });

  view.innerHTML = `
    <div class="card">
      <div class="toolbar">
        <div>
          <h2 class="card-title">Employee Directory</h2>
          <p class="card-subtitle">Showing ${filtered.length} of ${employees.length} employees</p>
        </div>
        <div class="filter-group">
          <input type="text" id="emp-search" class="search-input" placeholder="Search by name or ID..." value="${esc(state.searchQuery)}">
          <select id="emp-dept-filter">
            ${departments.map(d => `<option value="${d}" ${d === state.filterDept ? 'selected' : ''}>${d === 'ALL' ? 'All Departments' : d}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="table-responsive"><table class="table">
        <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Contact</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>${filtered.map((e) => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <div class="avatar-sm">${e.fullName.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong><a href="/employees/${e.id}" data-route="/employees/${e.id}" style="color:var(--text-main); text-decoration:none;">${esc(e.fullName)}</a></strong><br>
                  <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${esc(e.employeeId)}</span>
                </div>
              </div>
            </td>
            <td>${esc(e.department || '—')}</td>
            <td>${esc(e.jobTitle || '—')}</td>
            <td>${esc(e.phone || e.email)}</td>
            <td><span class="badge badge-leave">${esc(e.role)}</span></td>
            <td>
              <div style="display:flex; gap:0.35rem;">
                <button class="btn btn-outline btn-sm" onclick="navigateTo('/employees/${e.id}')">View</button>
                <button class="btn btn-secondary btn-sm" onclick="openEmployeeEditModal('${e.id}')">Edit</button>
              </div>
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>
    </div>
  `;

  $('#emp-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderEmployees();
  });

  $('#emp-dept-filter').addEventListener('change', (e) => {
    state.filterDept = e.target.value;
    renderEmployees();
  });
}

async function renderEmployeeDetail(empId) {
  try {
    const { employee: emp } = await api(`/api/employees/${empId}`);

    view.innerHTML = `
      <div class="grid-1">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="navigateTo('/employees')">${icons.arrowLeft} Back to Employees</button>
          <button class="btn btn-primary btn-sm" onclick="openEmployeeEditModal('${emp.id}')">Edit Employee</button>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">${esc(emp.fullName)}</h2>
                <p class="card-subtitle">${esc(emp.jobTitle || 'Staff Member')} &bull; ${esc(emp.department || 'General')}</p>
              </div>
              <span class="badge badge-present">Active</span>
            </div>

            <div class="grid-1" style="gap:1.25rem;">
              <div class="field-row">
                <div><div class="field-label">Employee ID</div><div style="font-weight:700; font-family:monospace; font-size:1.05rem;">${esc(emp.employeeId)}</div></div>
                <div><div class="field-label">System Role</div><div><span class="badge badge-leave">${esc(emp.role)}</span></div></div>
              </div>
              <div class="field-row">
                <div><div class="field-label">Email</div><div>${esc(emp.email)}</div></div>
                <div><div class="field-label">Phone</div><div>${esc(emp.phone || '—')}</div></div>
              </div>
              <div><div class="field-label">Address</div><div>${esc(emp.address || '—')}</div></div>
              <div class="field-row">
                <div><div class="field-label">Date of Joining</div><div>${dateText(emp.startDate)}</div></div>
                ${state.user.role === 'ADMIN' ? `<div><div class="field-label">Annual CTC</div><div style="font-weight:700; color:var(--primary); font-size:1.1rem;">${money(emp.salaryCents)}</div></div>` : ''}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Documents & Links</h2>
            </div>
            <div class="grid-1" style="gap:1rem;">
              <div>
                <div class="field-label">Profile Photo URL</div>
                ${emp.profilePhotoUrl ? `<a href="${esc(emp.profilePhotoUrl)}" target="_blank" rel="noreferrer" class="link-btn">${esc(emp.profilePhotoUrl)}</a>` : `<span style="color:var(--text-muted);">No photo linked</span>`}
              </div>
              <div>
                <div class="field-label">Verification Document URL</div>
                ${emp.documentUrl ? `<a href="${esc(emp.documentUrl)}" target="_blank" rel="noreferrer" class="link-btn">${esc(emp.documentUrl)}</a>` : `<span style="color:var(--text-muted);">No document linked</span>`}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    view.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="empty-state-title">Employee Not Found</div>
          <p class="empty-state-desc">${esc(err.message)}</p>
          <button class="btn btn-primary" onclick="navigateTo('/employees')">Back to Directory</button>
        </div>
      </div>
    `;
  }
}

window.openEmployeeEditModal = function(id) {
  const emp = state.employees.find(e => e.id === id);
  if (!emp) return;

  const isAdmin = state.user.role === 'ADMIN';

  const bodyHtml = `
    <form id="modal-emp-form" class="grid-1">
      <div class="field-row">
        <label class="field"><span class="field-label">Full Name</span><input name="fullName" value="${esc(emp.fullName)}" required></label>
        <label class="field"><span class="field-label">Phone</span><input name="phone" value="${esc(emp.phone || '')}"></label>
      </div>
      <div class="field-row">
        <label class="field"><span class="field-label">Department</span><input name="department" value="${esc(emp.department || '')}"></label>
        <label class="field"><span class="field-label">Job Title</span><input name="jobTitle" value="${esc(emp.jobTitle || '')}"></label>
      </div>
      <label class="field"><span class="field-label">Address</span><input name="address" value="${esc(emp.address || '')}"></label>
      <div class="field-row">
        <label class="field"><span class="field-label">Start Date</span><input name="startDate" type="date" value="${esc(emp.startDate || '')}"></label>
        ${isAdmin ? `<label class="field"><span class="field-label">Annual Salary (in ₹ Rupees)</span><input name="salaryRupees" type="number" value="${Math.round(emp.salaryCents / 100)}"></label>` : ''}
      </div>
      <div class="field-row">
        <label class="field"><span class="field-label">Photo URL</span><input name="profilePhotoUrl" type="url" value="${esc(emp.profilePhotoUrl || '')}"></label>
        <label class="field"><span class="field-label">Document URL</span><input name="documentUrl" type="url" value="${esc(emp.documentUrl || '')}"></label>
      </div>
    </form>
  `;

  openModal({
    title: `Edit Employee: ${emp.fullName}`,
    body: bodyHtml,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEmployeeModalEdit('${emp.id}')">Save Changes</button>
    `,
  });
};

window.submitEmployeeModalEdit = async function(id) {
  const form = $('#modal-emp-form');
  const payload = formObject(form);
  if (payload.salaryRupees !== undefined) {
    payload.salaryCents = Math.round(Number(payload.salaryRupees) * 100);
    delete payload.salaryRupees;
  }
  try {
    await api(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    closeModal();
    toast('Employee details saved!', 'success');
    await handleRoute();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ==========================================================================
// Route View: /attendance
// ==========================================================================
async function renderAttendanceModule() {
  const isStaff = state.user.role !== 'EMPLOYEE';
  const { records, weekStart } = await api(isStaff ? `/api/attendance?week=${state.selectedWeek}` : `/api/attendance/me?week=${state.selectedWeek}`);

  view.innerHTML = `
    <div class="grid-1">
      <div class="card">
        <div class="toolbar">
          <div>
            <h2 class="card-title">${isStaff ? 'Organisation Attendance Logs' : 'My Weekly Attendance'}</h2>
            <p class="card-subtitle">Week of ${dateText(weekStart)}</p>
          </div>
          <div class="filter-group">
            <button class="btn btn-outline btn-sm" onclick="offsetWeek(-7)">&larr; Previous Week</button>
            <button class="btn btn-outline btn-sm" onclick="state.selectedWeek = localDay(); renderAttendanceModule();">Current Week</button>
            <button class="btn btn-outline btn-sm" onclick="offsetWeek(7)">Next Week &rarr;</button>
          </div>
        </div>

        ${records.length === 0
          ? `<div class="empty-state"><div class="empty-state-title">No attendance records found</div><p class="empty-state-desc">No records recorded for this week.</p></div>`
          : `<div class="table-responsive"><table class="table">
              <thead><tr>
                ${isStaff ? `<th>Employee</th>` : ''}
                <th>Work Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Notes</th>
                ${isStaff ? `<th>Update</th>` : ''}
              </tr></thead>
              <tbody>${records.map((r) => `
                <tr>
                  ${isStaff ? `<td><strong>${esc(r.employeeName)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${esc(r.employeeCode)}</span></td>` : ''}
                  <td><strong>${dateText(r.workDate)}</strong></td>
                  <td>${timeText(r.checkInAt)}</td>
                  <td>${timeText(r.checkOutAt)}</td>
                  <td>${badge(r.status)}</td>
                  <td><span style="font-size:0.85rem; color:var(--text-muted);">${esc(r.notes || '—')}</span></td>
                  ${isStaff ? `<td><button class="btn btn-outline btn-sm" onclick="editAttendancePrompt('${r.id}', '${r.status}', '${esc(r.notes || '')}')">Edit</button></td>` : ''}
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    </div>
  `;
}

window.offsetWeek = function(days) {
  const cur = new Date(`${state.selectedWeek}T12:00:00Z`);
  cur.setUTCDate(cur.getUTCDate() + days);
  state.selectedWeek = cur.toISOString().slice(0, 10);
  renderAttendanceModule();
};

window.editAttendancePrompt = function(id, curStatus, curNotes) {
  const bodyHtml = `
    <form id="modal-att-form" class="grid-1">
      <label class="field"><span class="field-label">Attendance Status</span>
        <select name="status">
          ${['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(s => `<option value="${s}" ${s === curStatus ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
      <label class="field"><span class="field-label">Supervisor Notes</span>
        <input name="notes" value="${esc(curNotes)}" placeholder="Optional note">
      </label>
    </form>
  `;

  openModal({
    title: 'Update Attendance Record',
    body: bodyHtml,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAttendanceEditModal('${id}')">Save Status</button>
    `,
  });
};

window.submitAttendanceEditModal = async function(id) {
  const payload = formObject($('#modal-att-form'));
  try {
    await api(`/api/attendance/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    closeModal();
    toast('Attendance updated!', 'success');
    await renderAttendanceModule();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ==========================================================================
// Route View: /leave
// ==========================================================================
async function renderLeaveModule() {
  const isStaff = state.user.role !== 'EMPLOYEE';

  if (isStaff) {
    const { leaves } = await api('/api/leaves/all');
    const pending = leaves.filter(l => l.status === 'PENDING');
    const decided = leaves.filter(l => l.status !== 'PENDING');

    view.innerHTML = `
      <div class="grid-1">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Pending Leave Requests</h2>
              <p class="card-subtitle">${pending.length} requests awaiting your review</p>
            </div>
          </div>

          ${pending.length === 0
            ? `<div class="empty-state"><div class="empty-state-title">No pending requests</div><p class="empty-state-desc">All submitted leaves have been decided.</p></div>`
            : `<div class="table-responsive"><table class="table">
                <thead><tr><th>Employee</th><th>Dates</th><th>Type</th><th>Remarks</th><th>Actions</th></tr></thead>
                <tbody>${pending.map((l) => `
                  <tr>
                    <td><strong>${esc(l.employeeName)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${esc(l.employeeCode)}</span></td>
                    <td>${dateText(l.startDate)} &rarr; ${dateText(l.endDate)}</td>
                    <td>${esc(l.leaveType)}</td>
                    <td>${esc(l.remarks || '—')}</td>
                    <td>
                      <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-success btn-sm" onclick="decideLeavePrompt('${l.id}', 'APPROVED')">${icons.check} Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="decideLeavePrompt('${l.id}', 'REJECTED')">${icons.x} Reject</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}</tbody>
              </table></div>`
          }
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Historical Decisions</h2>
            <p class="card-subtitle">Approved and rejected requests</p>
          </div>
          ${decided.length === 0
            ? `<div class="empty-state"><div class="empty-state-title">No historical records</div></div>`
            : `<div class="table-responsive"><table class="table">
                <thead><tr><th>Employee</th><th>Dates</th><th>Type</th><th>Status</th><th>Reviewer Comment</th></tr></thead>
                <tbody>${decided.map((l) => `
                  <tr>
                    <td><strong>${esc(l.employeeName)}</strong></td>
                    <td>${dateText(l.startDate)} &rarr; ${dateText(l.endDate)}</td>
                    <td>${esc(l.leaveType)}</td>
                    <td>${badge(l.status)}</td>
                    <td><span style="font-size:0.85rem; color:var(--text-muted);">${esc(l.reviewerComments || '—')}</span></td>
                  </tr>
                `).join('')}</tbody>
              </table></div>`
          }
        </div>
      </div>
    `;
    return;
  }

  // Employee Leave View
  const { leaves } = await api('/api/leaves');

  view.innerHTML = `
    <div class="grid-2">
      <form id="apply-leave-form" class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Apply for Time Off</h2>
            <p class="card-subtitle">Submit a leave request for supervisor approval</p>
          </div>
        </div>
        <div class="grid-1">
          <label class="field"><span class="field-label">Leave Type</span>
            <select name="leaveType" required>
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </label>
          <div class="field-row">
            <label class="field"><span class="field-label">Start Date</span><input name="startDate" type="date" required id="leave-start"></label>
            <label class="field"><span class="field-label">End Date</span><input name="endDate" type="date" required id="leave-end"></label>
          </div>
          <label class="field"><span class="field-label">Reason / Remarks</span><textarea name="remarks" rows="3" placeholder="Explain the reason for your time off request..." required></textarea></label>
          <button class="btn btn-primary" style="align-self:flex-start;">Submit Leave Request</button>
        </div>
      </form>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">My Leave History</h2>
          <span style="font-size:0.85rem; color:var(--text-muted);">${leaves.length} Total</span>
        </div>
        ${leaves.length === 0
          ? `<div class="empty-state"><div class="empty-state-title">No leave history</div><p class="empty-state-desc">Your submitted requests will appear here.</p></div>`
          : `<div class="table-responsive"><table class="table">
              <thead><tr><th>Duration</th><th>Type</th><th>Status</th><th>Reviewer Comment</th></tr></thead>
              <tbody>${leaves.map((l) => `
                <tr>
                  <td><strong>${dateText(l.startDate)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">to ${dateText(l.endDate)}</span></td>
                  <td>${esc(l.leaveType)}</td>
                  <td>${badge(l.status)}</td>
                  <td><span style="font-size:0.85rem; color:var(--text-muted);">${esc(l.reviewerComments || '—')}</span></td>
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    </div>
  `;

  $('#apply-leave-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formObject(e.currentTarget);
    if (payload.endDate < payload.startDate) {
      toast('End date cannot be before start date.', 'error');
      return;
    }
    try {
      await api('/api/leaves', { method: 'POST', body: JSON.stringify(payload) });
      toast('Leave request submitted successfully!', 'success');
      await renderLeaveModule();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

window.decideLeavePrompt = async function(id, decision) {
  const comment = prompt(`Enter optional comment for ${decision.toLowerCase()}:`, '');
  if (comment === null) return;
  try {
    await api(`/api/leaves/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status: decision, comments: comment }),
    });
    toast(`Leave request ${decision.toLowerCase()}!`, 'success');
    await fetchNotifications();
    await renderLeaveModule();
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ==========================================================================
// Route View: /payroll
// ==========================================================================
async function renderPayrollModule() {
  const isAdmin = state.user.role === 'ADMIN';

  if (isAdmin) {
    const { employees } = await api('/api/employees');
    state.employees = employees;
    const { records } = await api('/api/payroll');

    const currentPeriod = localDay().slice(0, 7);

    view.innerHTML = `
      <div class="grid-2">
        <form id="admin-payroll-form" class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Process Monthly Payroll</h2>
              <p class="card-subtitle">Upsert salary slip & structure</p>
            </div>
          </div>
          <div class="grid-1">
            <label class="field"><span class="field-label">Select Employee</span>
              <select name="employeeId" id="pay-emp-select" required>
                ${employees.map(e => `<option value="${e.id}" data-salary="${Math.round(e.salaryCents / 100)}">${esc(e.fullName)} (${esc(e.employeeId)})</option>`).join('')}
              </select>
            </label>
            <div class="field-row">
              <label class="field"><span class="field-label">Pay Period (YYYY-MM)</span><input name="payPeriod" type="month" value="${currentPeriod}" required></label>
              <label class="field"><span class="field-label">Annual CTC (₹)</span><input name="salaryRupees" id="pay-ctc" type="number" required></label>
            </div>
            <div class="field-row">
              <label class="field"><span class="field-label">Basic Pay (₹)</span><input name="basicRupees" id="pay-basic" type="number" required></label>
              <label class="field"><span class="field-label">Allowances (₹)</span><input name="allowanceRupees" type="number" value="0"></label>
            </div>
            <label class="field"><span class="field-label">Deductions (₹)</span><input name="deductionRupees" type="number" value="0"></label>
            <button class="btn btn-primary" style="align-self:flex-start;">Save & Process Payroll</button>
          </div>
        </form>

        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Processed Payroll Records</h2>
              <p class="card-subtitle">Organisation payouts</p>
            </div>
          </div>
          ${records.length === 0
            ? `<div class="empty-state"><div class="empty-state-title">No payroll processed yet</div></div>`
            : `<div class="table-responsive"><table class="table">
                <thead><tr><th>Employee</th><th>Period</th><th>Basic</th><th>Net Pay</th></tr></thead>
                <tbody>${records.map((r) => `
                  <tr>
                    <td><strong>${esc(r.employeeName)}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${esc(r.employeeCode)}</span></td>
                    <td>${esc(r.payPeriod)}</td>
                    <td>${money(r.basicCents)}</td>
                    <td><strong style="color:var(--primary);">${money(r.netCents)}</strong></td>
                  </tr>
                `).join('')}</tbody>
              </table></div>`
          }
        </div>
      </div>
    `;

    const empSelect = $('#pay-emp-select');
    const updateDefaultSalaries = () => {
      const opt = empSelect.options[empSelect.selectedIndex];
      const annual = Number(opt?.dataset?.salary || 0);
      $('#pay-ctc').value = annual;
      $('#pay-basic').value = Math.round(annual / 12 * 0.7);
    };
    empSelect.addEventListener('change', updateDefaultSalaries);
    updateDefaultSalaries();

    $('#admin-payroll-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = formObject(e.currentTarget);
      const payload = {
        payPeriod: raw.payPeriod,
        salaryCents: Math.round(Number(raw.salaryRupees) * 100),
        basicCents: Math.round(Number(raw.basicRupees) * 100),
        allowanceCents: Math.round(Number(raw.allowanceRupees || 0) * 100),
        deductionCents: Math.round(Number(raw.deductionRupees || 0) * 100),
      };
      try {
        await api(`/api/payroll/${raw.employeeId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Payroll saved successfully!', 'success');
        await renderPayrollModule();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    return;
  }

  // Employee Payroll View
  const data = await api('/api/payroll/me');

  view.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header"><span class="metric-label">Annual Salary</span><div class="metric-icon-wrap indigo">${icons.payroll}</div></div>
        <div class="metric-val">${money(data.salaryCents)}</div>
        <div class="metric-footer">Annual CTC</div>
      </div>
      <div class="metric-card">
        <div class="metric-header"><span class="metric-label">Monthly Gross</span><div class="metric-icon-wrap green">${icons.payroll}</div></div>
        <div class="metric-val">${money(Math.round(data.salaryCents / 12))}</div>
        <div class="metric-footer">Estimated gross/mo</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Salary Slips & Payment History</h2>
          <p class="card-subtitle">Monthly breakdown of salary credits</p>
        </div>
      </div>

      ${data.records.length === 0
        ? `<div class="empty-state"><div class="empty-state-title">No payroll records found</div><p class="empty-state-desc">Salary slips will appear here once processed.</p></div>`
        : `<div class="table-responsive"><table class="table">
            <thead><tr><th>Pay Period</th><th>Basic Pay</th><th>Allowances</th><th>Deductions</th><th>Net Payout</th></tr></thead>
            <tbody>${data.records.map((r) => `
              <tr>
                <td><strong>${esc(r.payPeriod)}</strong></td>
                <td>${money(r.basicCents)}</td>
                <td style="color:var(--success-text); font-weight:600;">+${money(r.allowanceCents)}</td>
                <td style="color:var(--danger-text); font-weight:600;">-${money(r.deductionCents)}</td>
                <td><strong style="color:var(--primary); font-size:1.05rem;">${money(r.netCents)}</strong></td>
              </tr>
            `).join('')}</tbody>
          </table></div>`
      }
    </div>
  `;
}

// ==========================================================================
// Route View: /profile
// ==========================================================================
async function renderProfile() {
  const { profile } = await api('/api/profile');

  view.innerHTML = `
    <div class="grid-2">
      <form id="profile-edit-form" class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Contact & Personal Info</h2>
            <p class="card-subtitle">Update your personal contact channels</p>
          </div>
        </div>
        <div class="grid-1">
          <div class="field-row">
            <label class="field"><span class="field-label">Phone Number</span><input name="phone" value="${esc(profile.phone || '')}" placeholder="+91 90000 00000"></label>
            <label class="field"><span class="field-label">Profile Photo URL</span><input name="profilePhotoUrl" type="url" value="${esc(profile.profilePhotoUrl || '')}" placeholder="https://example.com/photo.jpg"></label>
          </div>
          <label class="field"><span class="field-label">Residential Address</span><textarea name="address" rows="3" placeholder="Enter your full address">${esc(profile.address || '')}</textarea></label>
          <label class="field"><span class="field-label">Document Link (ID Proof / Resume)</span><input name="documentUrl" type="url" value="${esc(profile.documentUrl || '')}" placeholder="https://drive.google.com/..."></label>
          <button class="btn btn-primary" style="align-self:flex-start;">Save Profile</button>
        </div>
      </form>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Employment Overview</h2>
          <span class="badge badge-present">Active</span>
        </div>
        <div class="grid-1" style="gap:1rem;">
          <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Full Name</div><div style="font-size:1.1rem; font-weight:700;">${esc(profile.fullName)}</div></div>
          <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Employee ID</div><div style="font-weight:600; font-family:monospace;">${esc(profile.employeeId)}</div></div>
          <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Email Address</div><div>${esc(profile.email)}</div></div>
          <div class="field-row">
            <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Department</div><div style="font-weight:600;">${esc(profile.department || '—')}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Designation</div><div style="font-weight:600;">${esc(profile.jobTitle || '—')}</div></div>
          </div>
          <div class="field-row">
            <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Date of Joining</div><div>${dateText(profile.startDate)}</div></div>
            <div><div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Role Access</div><div><span class="badge badge-leave">${esc(profile.role)}</span></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  $('#profile-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/profile', { method: 'PATCH', body: JSON.stringify(formObject(e.currentTarget)) });
      state.user = res.profile;
      $('#user-name').textContent = res.profile.fullName;
      toast('Profile updated successfully!', 'success');
      await renderProfile();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ==========================================================================
// Route View: /settings
// ==========================================================================
async function renderSettings() {
  view.innerHTML = `
    <div class="grid-2">
      <form id="change-pw-form" class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Security & Password</h2>
            <p class="card-subtitle">Update your Dayflow account password</p>
          </div>
        </div>
        <div class="grid-1">
          <label class="field"><span class="field-label">Current Password</span>
            <input name="currentPassword" type="password" required placeholder="Enter current password">
          </label>
          <label class="field"><span class="field-label">New Password</span>
            <input name="newPassword" type="password" required minlength="10" placeholder="Min 10 chars, uppercase, lowercase, number, symbol">
          </label>
          <button class="btn btn-primary" style="align-self:flex-start;">Update Password</button>
        </div>
      </form>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">System & Session Info</h2>
        </div>
        <div class="grid-1" style="gap:1rem;">
          <div><div class="field-label">Logged in as</div><div style="font-weight:700;">${esc(state.user.fullName)} (${esc(state.user.email)})</div></div>
          <div><div class="field-label">Assigned Role</div><div><span class="badge badge-leave">${esc(state.user.role)}</span></div></div>
          <div><div class="field-label">Session Lifetime</div><div>8 Hours (HMAC-SHA256 authenticated)</div></div>
          <div><div class="field-label">Local Timezone</div><div>Asia/Kolkata (IST)</div></div>
        </div>
      </div>
    </div>
  `;

  $('#change-pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = formObject(e.currentTarget);
      const res = await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify(payload) });
      toast(res.message, 'success');
      e.currentTarget.reset();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ==========================================================================
// Bootstrap Initial Route
// ==========================================================================
handleRoute();
