import {
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;
const secret = globalThis.process?.env?.DAYFLOW_SESSION_SECRET || 'dayflow-local-development-secret-change-before-production';

const encode = (value) => Buffer.from(value).toString('base64url');
const decode = (value) => Buffer.from(value, 'base64url').toString('utf8');

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expected, 'hex'));
}

export function createToken(user) {
  const payload = encode(JSON.stringify({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS }));
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readToken(token) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(decode(payload));
    if (!data.sub || !data.role || !Number.isInteger(data.exp) || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function newVerificationCode() {
  return String(randomInt(100000, 1000000));
}
