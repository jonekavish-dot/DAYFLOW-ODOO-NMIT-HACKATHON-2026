const ROLES = new Set(['EMPLOYEE', 'HR', 'ADMIN']);
const LEAVE_TYPES = new Set(['PAID', 'SICK', 'UNPAID']);
const LEAVE_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);
const ATTENDANCE_STATUSES = new Set(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const fail = (status, message) => { throw new HttpError(status, message); };

export function requiredString(value, label, max = 500) {
  if (typeof value !== 'string' || !value.trim()) fail(400, `${label} is required.`);
  const trimmed = value.trim();
  if (trimmed.length > max) fail(400, `${label} must be at most ${max} characters.`);
  return trimmed;
}

export function optionalString(value, label, max = 500) {
  if (value === undefined || value === null || value === '') return null;
  return requiredString(value, label, max);
}

export function email(value) {
  const result = requiredString(value, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Enter a valid email address.');
  return result;
}

export function password(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128 || !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    fail(400, 'Password must be 10-128 characters and include uppercase, lowercase, a number, and a symbol.');
  }
  return value;
}

export function employeeId(value) {
  const result = requiredString(value, 'Employee ID', 40).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(result)) fail(400, 'Employee ID may use only letters, numbers, hyphens, and underscores.');
  return result;
}

export function enumValue(value, valid, label) {
  if (!valid.has(value)) fail(400, `${label} is invalid.`);
  return value;
}

export function date(value, label) {
  const result = requiredString(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T12:00:00Z`))) fail(400, `${label} must use YYYY-MM-DD.`);
  return result;
}

export function month(value, label = 'Pay period') {
  const result = requiredString(value, label, 7);
  if (!/^\d{4}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}-01T12:00:00Z`))) fail(400, `${label} must use YYYY-MM.`);
  return result;
}

export function cents(value, label) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 1000000000) fail(400, `${label} must be a non-negative whole number of cents.`);
  return numeric;
}

export function url(value, label) {
  const result = optionalString(value, label, 1000);
  if (result === null) return null;
  try {
    const parsed = new URL(result);
    if (!['http:', 'https:'].includes(parsed.protocol)) fail(400, `${label} must be an HTTP(S) URL.`);
  } catch {
    fail(400, `${label} must be an HTTP(S) URL.`);
  }
  return result;
}

export { ROLES, LEAVE_TYPES, LEAVE_STATUSES, ATTENDANCE_STATUSES };
