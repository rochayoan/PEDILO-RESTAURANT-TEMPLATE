import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueMenuSession, verifyMenuSession } from './session.ts';
const secret = '012345678901234567890123456789ab';
test('session authentication and isolation', () => {
  const now = Date.now();
  const token = issueMenuSession({ restaurantId: 'demo-a', customerPhone: '59170000000', phoneNumberId: '123' }, secret, now);
  assert.equal(verifyMenuSession(token, secret, 'demo-a', now)?.customerPhone, '59170000000');
  assert.equal(verifyMenuSession(token, secret, 'demo-b', now), null);
  assert.equal(verifyMenuSession(token, secret, 'demo-a', now + 1800001), null);
  assert.equal(verifyMenuSession(token + 'x', secret, 'demo-a', now), null);
});
