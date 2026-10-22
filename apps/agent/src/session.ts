import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
export interface MenuSession {
  sessionId: string;
  restaurantId: string;
  customerPhone: string;
  phoneNumberId: string;
  expiresAt: string;
  replacesOrderId: null;
}
function sign(data: string, secret: string): string {
  if (secret.length < 32) throw new Error('session_secret_too_short');
  return createHmac('sha256', secret).update(data).digest('base64url');
}
export function issueMenuSession(input: {
  restaurantId: string; customerPhone: string; phoneNumberId: string;
}, secret: string, now = Date.now()): string {
  if (!/^\d{8,16}$/.test(input.customerPhone) || !input.phoneNumberId) {
    throw new Error('invalid_session_issuer_input');
  }
  const payload: MenuSession = {
    ...input, sessionId: randomUUID(),
    expiresAt: new Date(now + 30 * 60_000).toISOString(), replacesOrderId: null,
  };
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return raw + '.' + sign(raw, secret);
}
export function verifyMenuSession(
  token: string, secret: string, restaurantId: string, now = Date.now(),
): MenuSession | null {
  const [raw, signature, extra] = token.split('.');
  if (!raw || !signature || extra) return null;
  const expected = Buffer.from(sign(raw, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let data: unknown;
  try { data = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')); }
  catch { return null; }
  if (!data || typeof data !== 'object') return null;
  const v = data as Record<string, unknown>;
  if (v.restaurantId !== restaurantId || typeof v.sessionId !== 'string' ||
      typeof v.customerPhone !== 'string' || !/^\d{8,16}$/.test(v.customerPhone) ||
      typeof v.phoneNumberId !== 'string' || typeof v.expiresAt !== 'string' ||
      v.replacesOrderId !== null) return null;
  const expiresAt = Date.parse(v.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt > now + 30 * 60_000) return null;
  return v as unknown as MenuSession;
}
export function secureEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
