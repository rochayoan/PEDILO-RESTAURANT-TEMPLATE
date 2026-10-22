export type DeliveryMode = 'delivery' | 'pickup' | 'dine_in';
export type PaymentMethod = 'qr' | 'cash';
export interface RestaurantConfig {
  id: string;
  name: string;
  description: string;
  timezone: string;
  currency: string;
  address: string | null;
  mapsUrl: string | null;
  hours: { openHour: number; closeHour: number; days: number[] };
  services: Record<DeliveryMode, boolean>;
  payments: Record<PaymentMethod, boolean>;
  orderingEnabled: boolean;
  branding: { primary: string; accent: string; logoPath: string };
}
export type Env = Record<string, string | undefined>;
const get = (e: Env, key: string) => (e[key] ?? '').trim();
const required = (e: Env, key: string) => {
  const v = get(e, key);
  if (!v) throw new Error('missing_configuration:' + key);
  if (/CHANGE_ME|example\.invalid/i.test(v)) throw new Error('placeholder_configuration:' + key);
  return v;
};
const bool = (e: Env, key: string) => {
  const v = required(e, key);
  if (!['true', 'false'].includes(v)) throw new Error('invalid_boolean:' + key);
  return v === 'true';
};
const hour = (e: Env, key: string) => {
  const v = required(e, key);
  if (!/^\d{1,2}$/.test(v) || Number(v) > 23) throw new Error('invalid_hour:' + key);
  return Number(v);
};
export function loadRestaurantConfig(env: Env = process.env): RestaurantConfig {
  const openHour = hour(env, 'RESTAURANT_OPEN_HOUR');
  const closeHour = hour(env, 'RESTAURANT_CLOSE_HOUR');
  if (openHour === closeHour) throw new Error('unsupported_24h_schedule');
  const days = required(env, 'RESTAURANT_OPEN_DAYS').split(',').map(s => Number(s.trim()));
  if (!days.length || days.some(d => !Number.isInteger(d) || d < 0 || d > 6) ||
      days.length !== new Set(days).size) throw new Error('invalid_open_days');
  const timezone = required(env, 'RESTAURANT_TIME_ZONE');
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
  catch { throw new Error('invalid_timezone'); }
  const mapsUrl = get(env, 'RESTAURANT_MAPS_URL') || null;
  if (mapsUrl) {
    try { if (new URL(mapsUrl).protocol !== 'https:') throw Error(); }
    catch { throw new Error('invalid_maps_url'); }
  }
  const logoPath = required(env, 'RESTAURANT_LOGO_PATH');
  if (!/^\/[a-z0-9/_-]+\.(svg|png|webp)$/i.test(logoPath) || logoPath.includes('..')) {
    throw new Error('invalid_logo_path');
  }
  const services = {
    delivery: bool(env, 'RESTAURANT_DELIVERY'),
    pickup: bool(env, 'RESTAURANT_PICKUP'),
    dine_in: bool(env, 'RESTAURANT_DINE_IN'),
  };
  const payments = {
    qr: bool(env, 'RESTAURANT_PAYMENT_QR'),
    cash: bool(env, 'RESTAURANT_PAYMENT_CASH'),
  };
  if (!Object.values(services).some(Boolean)) throw new Error('no_delivery_mode');
  if (!Object.values(payments).some(Boolean)) throw new Error('no_payment_method');
  const primary = required(env, 'RESTAURANT_BRAND_PRIMARY');
  const accent = required(env, 'RESTAURANT_BRAND_ACCENT');
  if (![primary, accent].every(c => /^#[0-9a-f]{6}$/i.test(c))) throw new Error('invalid_brand_color');
  return {
    id: required(env, 'RESTAURANT_ID'),
    name: required(env, 'RESTAURANT_NAME'),
    description: required(env, 'RESTAURANT_DESCRIPTION'),
    timezone,
    currency: required(env, 'RESTAURANT_CURRENCY'),
    address: get(env, 'RESTAURANT_ADDRESS') || null,
    mapsUrl,
    hours: { openHour, closeHour, days },
    services, payments,
    orderingEnabled: bool(env, 'RESTAURANT_ORDERING_ENABLED'),
    branding: { primary, accent, logoPath },
  };
}
/** Overnight windows belong to the weekday on which that shift began. */
export function isOpenAt(config: RestaurantConfig, instant: Date): boolean {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone, weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const hour = Number(p.find(x => x.type === 'hour')?.value);
  const weekday = p.find(x => x.type === 'weekday')?.value;
  const mapping: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = weekday ? mapping[weekday] : undefined;
  if (!Number.isInteger(hour) || day === undefined) throw new Error('invalid_local_time');
  const { openHour, closeHour, days } = config.hours;
  if (openHour < closeHour) return days.includes(day) && hour >= openHour && hour < closeHour;
  return (hour >= openHour && days.includes(day)) ||
    (hour < closeHour && days.includes((day + 6) % 7));
}
