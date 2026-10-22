import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRestaurantConfig, isOpenAt } from './index.ts';
const env = {
  RESTAURANT_ID:'demo', RESTAURANT_NAME:'Restaurante de prueba',
  RESTAURANT_DESCRIPTION:'Comidas', RESTAURANT_TIME_ZONE:'America/La_Paz',
  RESTAURANT_CURRENCY:'BOB', RESTAURANT_OPEN_HOUR:'19', RESTAURANT_CLOSE_HOUR:'4',
  RESTAURANT_OPEN_DAYS:'0,1,2,3,4,5,6',
  RESTAURANT_DELIVERY:'true', RESTAURANT_PICKUP:'true', RESTAURANT_DINE_IN:'false',
  RESTAURANT_PAYMENT_QR:'false', RESTAURANT_PAYMENT_CASH:'true',
  RESTAURANT_ORDERING_ENABLED:'false', RESTAURANT_BRAND_PRIMARY:'#d34d26',
  RESTAURANT_BRAND_ACCENT:'#f5bf5a', RESTAURANT_LOGO_PATH:'/brand/logo.svg'
};
test('parses independent restaurant', () => {
  const cfg = loadRestaurantConfig(env);
  assert.equal(cfg.name, 'Restaurante de prueba');
  assert.equal(cfg.orderingEnabled, false);
});
test('fails closed for missing values', () => {
  assert.throws(() => loadRestaurantConfig({}), /missing_configuration/);
});
test('checks overnight hours with correct local day', () => {
  const cfg = loadRestaurantConfig(env);
  assert.equal(isOpenAt(cfg, new Date('2026-10-20T03:00:00Z')), true);
  assert.equal(isOpenAt(cfg, new Date('2026-10-20T15:00:00Z')), false);
});
