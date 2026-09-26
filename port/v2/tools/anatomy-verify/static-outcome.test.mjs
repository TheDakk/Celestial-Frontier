import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { summarizeStaticOutcome } from './static-outcome.mjs';
test('reports the real Mongoose blended failure even when every isolated action passes', () => {
  const report = JSON.parse(fs.readFileSync(new URL('../../../../audits/G1_AUTO_AUTHOR_20260926/auto-g2-v8/08-mongoose/static.json', import.meta.url)));
  assert.ok(report.rows.every(row => row.status === 'PASS'));
  const result = summarizeStaticOutcome(report);
  assert.equal(result.static, 'RED');
  assert.deepEqual(result.staticFails, ['presentation']);
  assert.match(result.staticRefusals[0].firstRefusal.error, /joint limit foreFarAnkle/);
  const control = structuredClone(report); control.presentation.status = 'PASS'; control.presentation.firstRefusal = null;
  assert.deepEqual(summarizeStaticOutcome(control).staticFails, []);
  assert.equal(summarizeStaticOutcome(control).static, 'RED', 'the reporter never changes gate status');
});
test('isolated and presentation failures retain their own first refusal; no synthesized success', () => {
  assert.deepEqual(summarizeStaticOutcome(null), { static: 'STATIC_ERROR', staticFails: null });
  const report = { status: 'RED', rows: [{ id: 'cast', status: 'RED', samples: 12, firstRefusal: { error: 'fold' } }], presentation: { status: 'RED', samples: 30, firstRefusal: { error: 'joint' } } };
  assert.deepEqual(summarizeStaticOutcome(report).staticFails, ['cast', 'presentation']);
  assert.deepEqual(summarizeStaticOutcome(report).staticRefusals.map(x => x.firstRefusal.error), ['fold', 'joint']);
  assert.deepEqual(summarizeStaticOutcome({ status: 'PASS_STATIC', rows: [{ id: 'cast', status: 'PASS' }], presentation: { status: 'PASS' } }).staticFails, []);
});
