/* Serpent strip author refusal controls (Codex C64 finding): degenerate bodies must refuse explicitly with finite measures or a named
 * reason, never flow on as NaN; a real synthetic snake still profiles OK. Run: node --test port/v2/tools/anatomy-verify/serpent-author.test.mjs */
import assert from 'node:assert/strict'; import { test } from 'node:test';
import { serpentProfile } from './serpent-author.mjs';
const canvas = (w, h, paint) => { const rgba = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (paint(x, y)) rgba[(y * w + x) * 4 + 3] = 255; return rgba; };
test('1-px and 2-px bodies refuse with a named reason (no NaN)', () => {
  for (const t of [1, 2]) { const P = serpentProfile(canvas(200, 60, (x, y) => x > 10 && x < 190 && y >= 30 && y < 30 + t), 200, 60);
    assert.equal(P.ok, false); assert.match(P.reasons.join(' '), /no measurable body/); for (const v of Object.values(P.measures)) if (typeof v === 'number') assert.ok(Number.isFinite(v)); } });
test('empty canvas refuses', () => { const P = serpentProfile(canvas(50, 50, () => false), 50, 50); assert.equal(P.ok, false); });
test('a synthetic tapering right-facing snake profiles OK with finite measures', () => {
  const w = 600, h = 120, thick = (x) => (x < 30 ? 2 + x / 3 : x > 560 ? 24 - (x - 560) / 3 : 12 + 8 * (x / 600)), cy = (x) => 60 + 20 * Math.sin(x / 60);
  const P = serpentProfile(canvas(w, h, (x, y) => x >= 20 && x <= 590 && Math.abs(y - cy(x)) <= thick(x) / 2), w, h);
  for (const v of Object.values(P.measures)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
  assert.ok(!P.reasons.some((r) => /non-finite|no measurable/.test(r)), P.reasons.join('; ')); });
