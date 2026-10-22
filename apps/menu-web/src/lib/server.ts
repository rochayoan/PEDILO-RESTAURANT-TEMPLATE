import 'server-only';

export interface MenuProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  category: string;
  isAvailable: boolean;
}
export interface MenuSession {
  restaurantId: string;
  customerPhone: string;
  phoneNumberId: string;
  sessionId: string;
  expiresAt: string;
}
function nonEmpty(value: string | undefined, key: string): string {
  const cleaned = value?.trim();
  if (!cleaned || /CHANGE_ME|example\.invalid/.test(cleaned)) {
    throw new Error('not_configured:' + key);
  }
  return cleaned.replace(/\/+$/, '');
}
async function getJson(url: string, token: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { authorization: 'Bearer ' + token, accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('central_unavailable');
  return response.json();
}
export async function resolveSession(token: string): Promise<MenuSession | null> {
  if (!token || token.length > 4096) return null;
  const base = nonEmpty(process.env.MENU_AGENT_BASE_URL, 'MENU_AGENT_BASE_URL');
  const key = nonEmpty(process.env.MENU_AGENT_INTERNAL_TOKEN, 'MENU_AGENT_INTERNAL_TOKEN');
  const response = await fetch(base + '/internal/menu/sessions/resolve', {
    method: 'POST', cache: 'no-store',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ token }), signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('session_service_unavailable');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') return null;
  const value = data as Record<string, unknown>;
  if (typeof value.sessionId !== 'string' ||
      typeof value.customerPhone !== 'string' ||
      typeof value.restaurantId !== 'string' ||
      value.restaurantId !== process.env.RESTAURANT_ID ||
      typeof value.expiresAt !== 'string') return null;
  return data as MenuSession;
}
export async function loadCatalog(): Promise<MenuProduct[]> {
  const base = nonEmpty(process.env.MENU_CENTRAL_BASE_URL, 'MENU_CENTRAL_BASE_URL');
  const key = nonEmpty(process.env.MENU_CENTRAL_SERVICE_TOKEN, 'MENU_CENTRAL_SERVICE_TOKEN');
  const [products, categories] = await Promise.all([
    getJson(base + '/products', key), getJson(base + '/categories', key),
  ]);
  if (!Array.isArray(products) || !Array.isArray(categories)) throw new Error('invalid_catalog_contract');
  const names = new Map<string, string>();
  for (const category of categories) {
    if (category && typeof category === 'object') {
      const c = category as Record<string, unknown>;
      if (typeof c.id === 'string' && typeof c.name === 'string' && c.isActive !== false) {
        names.set(c.id, c.name);
      }
    }
  }
  const items: MenuProduct[] = [];
  for (const product of products) {
    if (!product || typeof product !== 'object') continue;
    const p = product as Record<string, unknown>;
    if (typeof p.id !== 'string' || typeof p.name !== 'string' ||
        typeof p.categoryId !== 'string' || !names.has(p.categoryId) ||
        typeof p.price !== 'number' || !Number.isFinite(p.price) || p.price < 0 ||
        p.isActive === false) continue;
    items.push({
      id: p.id, code: typeof p.code === 'string' ? p.code : p.id,
      name: p.name, categoryId: p.categoryId, category: names.get(p.categoryId)!,
      description: typeof p.description === 'string' ? p.description : null,
      price: p.price, isAvailable: p.isAvailable === true,
    });
  }
  return items;
}
