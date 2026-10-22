import type { IncomingMessage, ServerResponse } from 'node:http';
import { issueMenuSession, verifyMenuSession, secureEquals } from './session.ts';

const key = process.env.AGENT_INTERNAL_TOKEN ?? '';
const secret = process.env.MENU_SESSION_SECRET ?? '';
const restaurantId = process.env.RESTAURANT_ID ?? '';
if (key.length < 32 || secret.length < 32) throw new Error('weak_agent_configuration');

export async function menuSessionRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = req.url?.split('?')[0];
  if (req.method !== 'POST' || !path?.startsWith('/internal/menu/sessions/')) return false;
  const auth = req.headers.authorization || '';
  if (!secureEquals(auth, 'Bearer ' + key)) {
    reply(res, 401, { error: 'unauthorized' });
    return true;
  }
  let raw = '';
  try {
    for await (const part of req) {
      raw += part.toString();
      if (Buffer.byteLength(raw) > 8192) throw Error('too_large');
    }
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid');
    const data = body as Record<string, unknown>;
    if (path === '/internal/menu/sessions/resolve') {
      const session = typeof data.token === 'string'
        ? verifyMenuSession(data.token, secret, restaurantId) : null;
      reply(res, session ? 200 : 404, session || { error: 'expired_or_invalid' });
      return true;
    }
    if (path === '/internal/menu/sessions/issue') {
      if (typeof data.customerPhone !== 'string' || typeof data.phoneNumberId !== 'string') {
        throw Error('invalid');
      }
      const token = issueMenuSession({
        restaurantId, customerPhone: data.customerPhone, phoneNumberId: data.phoneNumberId,
      }, secret);
      const url = (process.env.MENU_PUBLIC_URL || '').replace(/\/+$/, '') +
        '/menu?session=' + encodeURIComponent(token);
      reply(res, 200, { url });
      return true;
    }
  } catch {
    reply(res, 400, { error: 'invalid_request' });
    return true;
  }
  reply(res, 404, { error: 'not_found' });
  return true;
}
function reply(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
