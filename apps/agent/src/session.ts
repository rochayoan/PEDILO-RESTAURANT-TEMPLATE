import {
  createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, timingSafeEqual,
} from 'node:crypto';

export interface MenuSession {
  sessionId: string;
  restaurantId: string;
  customerPhone: string;
  phoneNumberId: string;
  expiresAt: string;
  replacesOrderId: null;
}
function keyFor(secret: string): Buffer {
  if (secret.length < 32) throw new Error('session_secret_too_short');
  return createHash('sha256').update(secret).digest();
}
export function issueMenuSession(input: {
  restaurantId: string; customerPhone: string; phoneNumberId: string;
}, secret: string, now = Date.now()): string {
  if (!/^\d{8,16}$/.test(input.customerPhone) || !input.phoneNumberId) {
    throw new Error('invalid_session_issuer_input');
  }
  const session: MenuSession = {
    ...input, sessionId: randomUUID(), replacesOrderId: null,
    expiresAt: new Date(now + 30 * 60_000).toISOString(),
  };
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(secret), nonce);
  const data = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  return [nonce.toString('base64url'), data.toString('base64url'),
    cipher.getAuthTag().toString('base64url')].join('.');
}
export function verifyMenuSession(
  token: string, secret: string, restaurantId: string, now = Date.now(),
): MenuSession | null {
  if (token.length > 4096) return null;
  const [iv, contents, tag, extra] = token.split('.');
  if (!iv || !contents || !tag || extra) return null;
  let data: unknown;
  try {
    const nonce = Buffer.from(iv, 'base64url');
    const auth = Buffer.from(tag, 'base64url');
    if (nonce.length !== 12 || auth.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFor(secret), nonce);
    decipher.setAuthTag(auth);
    const plain = Buffer.concat([decipher.update(Buffer.from(contents, 'base64url')), decipher.final()]);
    data = JSON.parse(plain.toString('utf8'));
  } catch { return null; }
  if (!data || typeof data !== 'object') return null;
  const v = data as Record<string, unknown>;
  if (v.restaurantId !== restaurantId || typeof v.sessionId !== 'string' ||
      typeof v.customerPhone !== 'string' || !/^\d{8,16}$/.test(v.customerPhone) ||
      typeof v.phoneNumberId !== 'string' || typeof v.expiresAt !== 'string' ||
      v.replacesOrderId !== null) return null;
  const expiration = Date.parse(v.expiresAt);
  if (!Number.isFinite(expiration) || expiration <= now || expiration > now + 30 * 60_000) return null;
  return v as unknown as MenuSession;
}
export function secureEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
