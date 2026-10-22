import 'dotenv/config';
import { loadRestaurantConfig } from '@pedilo/config';
const config = loadRestaurantConfig();
const mandatory = [
  'AGENT_INTERNAL_TOKEN', 'MENU_SESSION_SECRET', 'KAPSO_API_KEY',
  'KAPSO_WEBHOOK_SECRET', 'KAPSO_PHONE_NUMBER_ID', 'OPENAI_API_KEY',
  'BACKEND_CENTRAL_BASE_URL', 'BACKEND_CENTRAL_SERVICE_TOKEN',
  'MENU_PUBLIC_URL', 'MENU_AGENT_BASE_URL', 'MENU_AGENT_INTERNAL_TOKEN',
  'MENU_CENTRAL_BASE_URL', 'MENU_CENTRAL_SERVICE_TOKEN',
];
for (const key of mandatory) {
  const value = process.env[key] ?? '';
  if (!value || /CHANGE_ME|example\.invalid/i.test(value)) {
    throw new Error('missing_integration_configuration:' + key);
  }
}
if (config.name !== process.env.NEXT_PUBLIC_RESTAURANT_NAME) {
  throw new Error('restaurant_name_mismatch');
}
if (config.branding.primary !== process.env.NEXT_PUBLIC_RESTAURANT_PRIMARY ||
    config.branding.accent !== process.env.NEXT_PUBLIC_RESTAURANT_ACCENT) {
  throw new Error('restaurant_brand_mismatch');
}
if (process.env.MENU_AGENT_INTERNAL_TOKEN !== process.env.AGENT_INTERNAL_TOKEN) {
  throw new Error('agent_auth_token_mismatch');
}
if (process.env.MENU_CENTRAL_BASE_URL !== process.env.BACKEND_CENTRAL_BASE_URL) {
  throw new Error('central_url_mismatch');
}
if (process.env.MENU_CENTRAL_SERVICE_TOKEN !== process.env.BACKEND_CENTRAL_SERVICE_TOKEN) {
  throw new Error('central_token_mismatch');
}
console.log('Configuración válida. Aún se requieren pruebas de integración antes de producción.');
