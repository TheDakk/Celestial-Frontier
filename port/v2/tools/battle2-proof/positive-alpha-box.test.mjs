import assert from 'node:assert/strict';
import test from 'node:test';
import { positiveAlphaBox } from './positive-alpha-box.mjs';

test('alpha 1 and 8 pixels expand sizing while transparent coloured pixels do not', () => {
  const rgba = new Uint8ClampedArray(6 * 5 * 4);
  const set = (x, y, alpha) => rgba.set([255, 51, 204, alpha], (y * 6 + x) * 4);
  set(0, 0, 0); set(5, 4, 0); set(1, 1, 1); set(4, 3, 8); set(3, 2, 255);
  const before = rgba.slice();
  assert.deepEqual(positiveAlphaBox(rgba, 6, 5), { x: 1, y: 1, width: 4, height: 3 });
  assert.deepEqual(rgba, before);
  const oldThreshold = rgba.slice();
  for (let i = 3; i < oldThreshold.length; i += 4) if (oldThreshold[i] <= 8) oldThreshold[i] = 0;
  assert.deepEqual(positiveAlphaBox(oldThreshold, 6, 5), { x: 3, y: 2, width: 1, height: 1 });
});

test('opaque legacy input retains the exact former bounding box', () => {
  const rgba = new Uint8Array(7 * 6 * 4);
  for (const [x, y] of [[2, 1], [5, 2], [3, 4]]) rgba[(y * 7 + x) * 4 + 3] = 255;
  let x0 = 7, y0 = 6, x1 = -1, y1 = -1;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) if (rgba[(y * 7 + x) * 4 + 3] > 8) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  assert.deepEqual(positiveAlphaBox(rgba, 7, 6), { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
});

test('one positive corner pixel is retained and empty alpha refuses', () => {
  const rgba = new Uint8Array(4 * 4 * 4);
  assert.throws(() => positiveAlphaBox(rgba, 4, 4), /empty alpha/);
  rgba[rgba.length - 1] = 1;
  assert.deepEqual(positiveAlphaBox(rgba, 4, 4), { x: 3, y: 3, width: 1, height: 1 });
});

test('malformed dimensions cannot yield a misleading box', () => {
  for (const [rgba, width, height] of [[new Uint8Array(4), 2, 2], [null, 1, 1], [new Uint8Array(4), 0, 1], [new Uint8Array(4), 1.5, 1]]) {
    assert.throws(() => positiveAlphaBox(rgba, width, height), /invalid RGBA dimensions/);
  }
});
