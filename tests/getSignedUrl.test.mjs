import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSignedUrl } from '../credit-dashboard/src/utils.js';

test('getSignedUrl rejects empty key without fetch', async () => {
  let called = false;
  const original = global.fetch;
  global.fetch = () => { called = true; throw new Error('fetch called'); };
  await assert.rejects(() => getSignedUrl('', {}, ''), /Invalid key/);
  assert.strictEqual(called, false);
  global.fetch = original;
});

test('getSignedUrl rejects "undefined" string without fetch', async () => {
  let called = false;
  const original = global.fetch;
  global.fetch = () => { called = true; throw new Error('fetch called'); };
  await assert.rejects(() => getSignedUrl('undefined', {}, ''), /Invalid key/);
  assert.strictEqual(called, false);
  global.fetch = original;
});
